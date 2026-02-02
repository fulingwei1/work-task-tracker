import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import {
  successList,
  successSingle,
  badRequest,
  notFound,
  forbidden,
  serverError,
  parsePagination,
} from "@/lib/api/response"
import { canViewTask, canEditTask } from "@/lib/api/permissions"
import { TaskStatus } from "@prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id]/updates - List task updates
export const GET = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!
      const searchParams = request.nextUrl.searchParams
      const { page, limit, skip } = parsePagination(searchParams)

      // Check task exists and user has view permission
      const task = await prisma.task.findUnique({
        where: { id, deletedAt: null },
        include: {
          owner: {
            select: { departmentId: true },
          },
        },
      })

      if (!task) {
        return notFound("Task not found")
      }

      const canView = await canViewTask(user, task.ownerId, task.owner.departmentId)
      if (!canView) {
        return forbidden("You do not have permission to view this task")
      }

      // Get updates
      const [updates, total] = await Promise.all([
        prisma.taskUpdate.findMany({
          where: { taskId: id },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.taskUpdate.count({ where: { taskId: id } }),
      ])

      return successList(updates, { total, page, limit })
    } catch (error) {
      console.error("Failed to list task updates:", error)
      return serverError("Failed to list task updates")
    }
  }
)

// POST /api/tasks/[id]/updates - Create task update
export const POST = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!
      const body = await request.json()

      // Validate required fields
      const { progressPercent } = body
      if (progressPercent === undefined || progressPercent === null) {
        return badRequest("Progress percent is required")
      }

      if (typeof progressPercent !== "number" || progressPercent < 0 || progressPercent > 100) {
        return badRequest("Progress percent must be a number between 0 and 100")
      }

      // Check task exists and user has edit permission
      const task = await prisma.task.findUnique({
        where: { id, deletedAt: null },
        include: {
          owner: {
            select: { departmentId: true },
          },
        },
      })

      if (!task) {
        return notFound("Task not found")
      }

      // Check if user is owner, collaborator, or has edit permission
      const isOwnerOrCollaborator =
        task.ownerId === user.id || task.collaboratorIds.includes(user.id)
      const hasEditPermission = await canEditTask(user, task)

      if (!isOwnerOrCollaborator && !hasEditPermission) {
        return forbidden("You do not have permission to update this task")
      }

      // Validate status if provided
      let newStatus: TaskStatus | undefined
      if (body.status) {
        if (!Object.values(TaskStatus).includes(body.status)) {
          return badRequest("Invalid status value")
        }
        newStatus = body.status as TaskStatus
      }

      // Validate estimated completion if provided
      let estimatedCompletion: Date | null = null
      if (body.estimatedCompletion) {
        estimatedCompletion = new Date(body.estimatedCompletion)
        if (isNaN(estimatedCompletion.getTime())) {
          return badRequest("Invalid estimated completion date")
        }
      }

      // Create update and optionally update task status in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the progress update
        const update = await tx.taskUpdate.create({
          data: {
            taskId: id,
            userId: user.id,
            progressPercent: Math.round(progressPercent),
            status: newStatus ?? null,
            blockerType: body.blockerType ?? null,
            blockerDesc: body.blockerDesc ?? null,
            nextAction: body.nextAction ?? null,
            estimatedCompletion,
          },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        })

        // If status was provided, update the task status too
        if (newStatus) {
          await tx.task.update({
            where: { id },
            data: { status: newStatus },
          })
        }

        return update
      })

      return successSingle(result)
    } catch (error) {
      console.error("Failed to create task update:", error)
      return serverError("Failed to create task update")
    }
  }
)
