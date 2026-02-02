import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { successSingle, successList, errorResponse, notFound, badRequest, forbidden } from "@/lib/api/response"
import { createNotification } from "@/lib/notifications"
import { NotificationType, TaskStatus, ReviewResult, QualityRating } from "@prisma/client"

// GET /api/tasks/[id]/reviews - 获取任务验收记录
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

  const reviews = await prisma.review.findMany({
    where: { taskId },
    include: {
      reviewer: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return successList(reviews, {
    total: reviews.length,
    page: 1,
    limit: reviews.length,
  })
}

// POST /api/tasks/[id]/reviews - 提交验收
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession()
  if (!session) {
    return errorResponse("Unauthorized", 401)
  }

  const { id: taskId } = params

  // 验证任务存在且状态为待验收
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true } },
    },
  })

  if (!task) {
    return notFound("Task not found")
  }

  // 只有任务创建者、主管或管理员可以验收
  const canReview =
    task.createdBy === session.id ||
    session.role === "MANAGER" ||
    session.role === "DIRECTOR" ||
    session.role === "CEO" ||
    session.role === "ADMIN"

  if (!canReview) {
    return forbidden("没有权限验收此任务")
  }

  // 不能验收自己负责的任务（除非是管理员）
  if (task.ownerId === session.id && session.role !== "ADMIN") {
    return badRequest("不能验收自己负责的任务")
  }

  try {
    const body = await request.json()
    const { result, failReason, rating, ratingReason, suggestions } = body

    // 验证必填字段
    if (!result || !["PASS", "FAIL"].includes(result)) {
      return badRequest("请选择验收结果")
    }

    if (result === "FAIL" && !failReason?.trim()) {
      return badRequest("验收不通过时请填写原因")
    }

    // 验证评级
    let validatedRating: QualityRating | null = null
    if (rating && ["EXCELLENT", "QUALIFIED", "RISK", "UNQUALIFIED"].includes(rating)) {
      validatedRating = rating as QualityRating
    }

    // 创建验收记录
    const review = await prisma.review.create({
      data: {
        taskId,
        reviewerId: session.id,
        result: result as ReviewResult,
        failReason: result === "FAIL" ? failReason?.trim() : null,
        rating: validatedRating,
        ratingReason: ratingReason?.trim() || null,
        suggestions: suggestions?.trim() || null,
      },
      include: {
        reviewer: {
          select: { id: true, name: true },
        },
      },
    })

    // 更新任务状态
    const newStatus = result === "PASS" ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS
    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    })

    // 发送通知给任务负责人
    const notificationType = result === "PASS"
      ? NotificationType.TASK_REVIEW_PASSED
      : NotificationType.TASK_REVIEW_FAILED

    const notificationTitle = result === "PASS" ? "任务验收通过" : "任务验收未通过"
    const notificationContent = result === "PASS"
      ? `任务「${task.title}」已通过验收${validatedRating ? `，评级：${getRatingLabel(validatedRating)}` : ""}`
      : `任务「${task.title}」验收未通过，原因：${failReason}`

    await createNotification({
      userId: task.ownerId,
      type: notificationType,
      title: notificationTitle,
      content: notificationContent,
      taskId,
    })

    return successSingle(review)
  } catch (error) {
    console.error("Failed to create review:", error)
    return errorResponse("提交验收失败", 500)
  }
}

// 评级标签
function getRatingLabel(rating: QualityRating): string {
  const labels: Record<QualityRating, string> = {
    EXCELLENT: "优秀",
    QUALIFIED: "达标",
    RISK: "风险",
    UNQUALIFIED: "不达标",
  }
  return labels[rating]
}
