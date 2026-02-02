import { prisma } from "@/lib/db"
import { NotificationType } from "@prisma/client"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content: string
  taskId?: string
}

export async function createNotification({
  userId,
  type,
  title,
  content,
  taskId,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      taskId,
    },
  })
}

export async function createTaskAssignedNotification(
  ownerId: string,
  taskId: string,
  taskTitle: string,
  creatorName: string
) {
  return createNotification({
    userId: ownerId,
    type: NotificationType.TASK_ASSIGNED,
    title: "New task assigned",
    content: `${creatorName} assigned you a task: "${taskTitle}"`,
    taskId,
  })
}
