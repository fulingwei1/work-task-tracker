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
import { canEditTask } from "@/lib/api/permissions"
import { TaskStatus } from "@prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/tasks/[id]/status - Update task status only
export const PATCH = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!
      const body = await request.json()

      // Validate status
      const { status } = body
      if (!status) {
        return badRequest("Status is required")
      }

      if (!Object.values(TaskStatus).includes(status)) {
        return badRequest("Invalid status value")
      }

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
        return forbidden("You do not have permission to update this task's status")
      }

      // Update status
      const task = await prisma.task.update({
        where: { id },
        data: { status: status as TaskStatus },
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
      console.error("Failed to update task status:", error)
      return serverError("Failed to update task status")
    }
  }
)
