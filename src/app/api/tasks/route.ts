import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth, type SessionUser } from "@/lib/auth"
import {
  successList,
  successSingle,
  badRequest,
  forbidden,
  serverError,
  parsePagination,
} from "@/lib/api/response"
import {
  getTaskVisibilityFilter,
  canAssignTaskTo,
} from "@/lib/api/permissions"
import { createTaskAssignedNotification } from "@/lib/notifications"
import { TaskPriority, TaskStatus, Prisma } from "@prisma/client"

// GET /api/tasks - List tasks with filtering
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    // Build filter conditions
    const where: Prisma.TaskWhereInput = {
      deletedAt: null, // Exclude soft-deleted tasks
    }

    // Role-based visibility filter
    const visibilityFilter = getTaskVisibilityFilter(user)
    if (visibilityFilter) {
      Object.assign(where, visibilityFilter)
    }

    // Query filters
    const status = searchParams.get("status")
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus
    }

    const ownerId = searchParams.get("ownerId")
    if (ownerId) {
      where.ownerId = ownerId
    }

    const deptId = searchParams.get("deptId")
    if (deptId) {
      where.owner = { ...where.owner as Prisma.UserWhereInput, departmentId: deptId }
    }

    const dueBefore = searchParams.get("dueBefore")
    if (dueBefore) {
      where.dueDate = { ...where.dueDate as Prisma.DateTimeNullableFilter, lte: new Date(dueBefore) }
    }

    const dueAfter = searchParams.get("dueAfter")
    if (dueAfter) {
      where.dueDate = { ...where.dueDate as Prisma.DateTimeNullableFilter, gte: new Date(dueAfter) }
    }

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, departmentId: true },
          },
          creator: {
            select: { id: true, name: true },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              progressPercent: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    // Transform tasks to include latest progress
    const data = tasks.map((task) => {
      const latestUpdate = task.updates[0]
      return {
        id: task.id,
        title: task.title,
        ownerId: task.ownerId,
        owner: task.owner,
        collaboratorIds: task.collaboratorIds,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        acceptanceCriteria: task.acceptanceCriteria,
        source: task.source,
        createdBy: task.createdBy,
        creator: task.creator,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        latestProgress: latestUpdate?.progressPercent ?? null,
        latestUpdateAt: latestUpdate?.createdAt ?? null,
      }
    })

    return successList(data, { total, page, limit })
  } catch (error) {
    console.error("Failed to list tasks:", error)
    return serverError("Failed to list tasks")
  }
})

// POST /api/tasks - Create a new task
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()

    // Validate required fields
    const { title, ownerId, dueDate, priority } = body
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return badRequest("Title is required")
    }

    if (!ownerId || typeof ownerId !== "string") {
      return badRequest("Owner ID is required")
    }

    // Check if user can assign task to target owner
    const canAssign = await canAssignTaskTo(user, ownerId)
    if (!canAssign) {
      return forbidden("You do not have permission to assign tasks to this user")
    }

    // Validate owner exists
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    })
    if (!owner) {
      return badRequest("Owner not found")
    }

    // Validate priority if provided
    let taskPriority: TaskPriority = TaskPriority.P2
    if (priority) {
      if (!Object.values(TaskPriority).includes(priority)) {
        return badRequest("Invalid priority value")
      }
      taskPriority = priority as TaskPriority
    }

    // Validate collaborator IDs if provided
    const collaboratorIds: string[] = body.collaboratorIds ?? []
    if (collaboratorIds.length > 0) {
      const collaborators = await prisma.user.findMany({
        where: { id: { in: collaboratorIds } },
        select: { id: true },
      })
      if (collaborators.length !== collaboratorIds.length) {
        return badRequest("One or more collaborators not found")
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        ownerId,
        collaboratorIds,
        priority: taskPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        acceptanceCriteria: body.acceptanceCriteria ?? null,
        createdBy: user.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, departmentId: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    // Create TASK_ASSIGNED notification for the owner
    await createTaskAssignedNotification(
      ownerId,
      task.id,
      task.title,
      user.name
    )

    return successSingle(task)
  } catch (error) {
    console.error("Failed to create task:", error)
    return serverError("Failed to create task")
  }
})
