import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { successSingle, successList, errorResponse, notFound, badRequest } from "@/lib/api/response"
import { createNotification } from "@/lib/notifications"
import { NotificationType } from "@prisma/client"

// GET /api/tasks/[id]/comments - 获取任务评论列表
export async function GET(
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
  })

  if (!task) {
    return notFound("Task not found")
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { taskId } }),
  ])

  return successList(comments, { total, page, limit })
}

// POST /api/tasks/[id]/comments - 创建评论
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
    },
  })

  if (!task) {
    return notFound("Task not found")
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return badRequest("Comment content is required")
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: session.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    // 发送通知给任务负责人（如果不是自己）
    if (task.ownerId !== session.id) {
      await createNotification({
        userId: task.ownerId,
        type: NotificationType.TASK_COMMENTED,
        title: "任务有新评论",
        content: `${session.name} 评论了任务「${task.title}」: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        taskId,
      })
    }

    // 发送通知给任务创建者（如果不是自己且不是负责人）
    if (task.createdBy !== session.id && task.createdBy !== task.ownerId) {
      await createNotification({
        userId: task.createdBy,
        type: NotificationType.TASK_COMMENTED,
        title: "任务有新评论",
        content: `${session.name} 评论了任务「${task.title}」: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        taskId,
      })
    }

    return successSingle(comment)
  } catch (error) {
    console.error("Failed to create comment:", error)
    return errorResponse("Failed to create comment", 500)
  }
}
