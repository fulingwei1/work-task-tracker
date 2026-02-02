import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import {
  successSingle,
  badRequest,
  notFound,
  forbidden,
  serverError,
} from "@/lib/api/response"
import { canViewTask, canEditTask, canDeleteTask } from "@/lib/api/permissions"
import { TaskPriority } from "@prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id] - Get task details with updates
export const GET = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!

      const task = await prisma.task.findUnique({
        where: { id, deletedAt: null },
        include: {
          owner: {
            select: { id: true, name: true, departmentId: true },
          },
          creator: {
            select: { id: true, name: true },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      })

      if (!task) {
        return notFound("Task not found")
      }

      // Check view permission
      const canView = await canViewTask(
        user,
        task.ownerId,
        task.owner.departmentId
      )
      if (!canView) {
        return forbidden("You do not have permission to view this task")
      }

      return successSingle(task)
    } catch (error) {
      console.error("Failed to get task:", error)
      return serverError("Failed to get task")
    }
  }
)

// PATCH /api/tasks/[id] - Update task
export const PATCH = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!
      const body = await request.json()

      // Get existing task with owner info for permission check
      const existingTask = await prisma.task.findUnique({
        where: { id, deletedAt: null },
        include: {
          owner: {
            select: { departmentId: true },
          },
        },
      })

      if (!existingTask) {
        return notFound("Task not found")
      }

      // Check edit permission
      const canEdit = await canEditTask(user, existingTask)
      if (!canEdit) {
        return forbidden("You do not have permission to edit this task")
      }

      // Build update data
      const updateData: Record<string, unknown> = {}

      if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim().length === 0) {
          return badRequest("Title must be a non-empty string")
        }
        updateData.title = body.title.trim()
      }

      if (body.ownerId !== undefined) {
        // Cannot change owner via this endpoint - use a dedicated endpoint if needed
        return badRequest("Cannot change task owner via this endpoint")
      }

      if (body.collaboratorIds !== undefined) {
        if (!Array.isArray(body.collaboratorIds)) {
          return badRequest("Collaborator IDs must be an array")
        }
        // Validate collaborators exist
        if (body.collaboratorIds.length > 0) {
          const collaborators = await prisma.user.findMany({
            where: { id: { in: body.collaboratorIds } },
            select: { id: true },
          })
          if (collaborators.length !== body.collaboratorIds.length) {
            return badRequest("One or more collaborators not found")
          }
        }
        updateData.collaboratorIds = body.collaboratorIds
      }

      if (body.priority !== undefined) {
        if (!Object.values(TaskPriority).includes(body.priority)) {
          return badRequest("Invalid priority value")
        }
        updateData.priority = body.priority
      }

      if (body.dueDate !== undefined) {
        updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
      }

      if (body.acceptanceCriteria !== undefined) {
        updateData.acceptanceCriteria = body.acceptanceCriteria
      }

      // Update task
      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: { id: true, name: true, departmentId: true },
          },
          creator: {
            select: { id: true, name: true },
          },
        },
      })

      return successSingle(task)
    } catch (error) {
      console.error("Failed to update task:", error)
      return serverError("Failed to update task")
    }
  }
)

// DELETE /api/tasks/[id] - Soft delete task
export const DELETE = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!

      // Get existing task with owner info for permission check
      const existingTask = await prisma.task.findUnique({
        where: { id, deletedAt: null },
        include: {
          owner: {
            select: { departmentId: true },
          },
        },
      })

      if (!existingTask) {
        return notFound("Task not found")
      }

      // Check delete permission
      const canDelete = await canDeleteTask(user, existingTask)
      if (!canDelete) {
        return forbidden("You do not have permission to delete this task")
      }

      // Soft delete
      const task = await prisma.task.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true, deletedAt: true },
      })

      return successSingle(task)
    } catch (error) {
      console.error("Failed to delete task:", error)
      return serverError("Failed to delete task")
    }
  }
)
