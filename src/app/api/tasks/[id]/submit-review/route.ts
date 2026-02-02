import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { successSingle, errorResponse, notFound, badRequest, forbidden } from "@/lib/api/response"
import { createNotification } from "@/lib/notifications"
import { NotificationType, TaskStatus } from "@prisma/client"

// POST /api/tasks/[id]/submit-review - 提交任务进行验收
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession()
  if (!session) {
    return errorResponse("Unauthorized", 401)
  }

  const { id: taskId } = params

  // 验证任务存在
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  })

  if (!task) {
    return notFound("Task not found")
  }

  // 只有任务负责人可以提交验收
  if (task.ownerId !== session.id) {
    return forbidden("只有任务负责人可以提交验收")
  }

  // 检查任务状态
  if (task.status === TaskStatus.COMPLETED) {
    return badRequest("任务已完成，无需重复提交验收")
  }

  if (task.status === TaskStatus.CANCELLED) {
    return badRequest("已取消的任务无法提交验收")
  }

  if (task.status === TaskStatus.PENDING_REVIEW) {
    return badRequest("任务已在待验收状态")
  }

  try {
    // 更新任务状态为待验收
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.PENDING_REVIEW },
    })

    // 发送通知给任务创建者
    if (task.createdBy !== session.id) {
      await createNotification({
        userId: task.createdBy,
        type: NotificationType.TASK_REVIEW_REQUESTED,
        title: "任务待验收",
        content: `${session.name} 提交了任务「${task.title}」等待验收`,
        taskId,
      })
    }

    return successSingle({ 
      message: "任务已提交验收",
      status: updatedTask.status,
    })
  } catch (error) {
    console.error("Failed to submit review:", error)
    return errorResponse("提交验收失败", 500)
  }
}
