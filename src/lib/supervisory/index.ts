import { prisma } from "@/lib/db"
import { NotificationType, NotificationChannel, TaskStatus } from "@prisma/client"

const DEDUP_WINDOW_HOURS = 24
const DUE_SOON_DAYS = 2
const NO_UPDATE_DAYS = 7
const BLOCKED_THRESHOLD_DAYS = 2

interface SupervisoryResult {
  dueSoon: number
  overdue: number
  noUpdate: number
  blocked: number
  totalNotifications: number
}

/**
 * Check if a notification was already sent for this task/type within the dedup window
 */
async function wasNotificationSentRecently(
  taskId: string,
  triggerType: NotificationType
): Promise<boolean> {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - DEDUP_WINDOW_HOURS)

  const existing = await prisma.notificationLog.findFirst({
    where: {
      taskId,
      triggerType,
      sentAt: { gte: cutoff },
    },
  })

  return existing !== null
}

/**
 * Create notification and log entry
 */
async function createSupervisoryNotification(params: {
  userId: string
  type: NotificationType
  title: string
  content: string
  taskId: string
  channel: NotificationChannel
}): Promise<void> {
  const { userId, type, title, content, taskId, channel } = params

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      taskId,
    },
  })

  // Log for dedup
  await prisma.notificationLog.create({
    data: {
      taskId,
      triggerType: type,
      channel,
    },
  })
}

/**
 * Get the manager of a user (if they have one)
 */
async function getUserManager(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          users: {
            where: { role: "MANAGER" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  })

  if (!user?.department?.users?.[0]) {
    return null
  }

  const managerId = user.department.users[0].id
  return managerId !== userId ? managerId : null
}

/**
 * Scan for tasks due within 2 days (TASK_DUE_SOON)
 */
async function scanDueSoonTasks(): Promise<number> {
  const now = new Date()
  const dueSoonDate = new Date()
  dueSoonDate.setDate(dueSoonDate.getDate() + DUE_SOON_DAYS)

  // Find tasks due within 2 days, not overdue yet, not completed/cancelled
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueDate: {
        gt: now,
        lte: dueSoonDate,
      },
      status: {
        notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      },
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
  })

  let count = 0
  for (const task of tasks) {
    const alreadySent = await wasNotificationSentRecently(
      task.id,
      NotificationType.TASK_DUE_SOON
    )
    if (alreadySent) continue

    const daysLeft = Math.ceil(
      (task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_DUE_SOON,
      title: "Task due soon",
      content: `Task "${task.title}" is due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++
  }

  return count
}

/**
 * Scan for overdue tasks (TASK_OVERDUE)
 */
async function scanOverdueTasks(): Promise<number> {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  // Find tasks that are overdue
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueDate: {
        lt: now,
      },
      status: {
        notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      },
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
  })

  let count = 0
  for (const task of tasks) {
    const alreadySent = await wasNotificationSentRecently(
      task.id,
      NotificationType.TASK_OVERDUE
    )
    if (alreadySent) continue

    const daysOverdue = Math.ceil(
      (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Notify owner
    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_OVERDUE,
      title: "Task overdue",
      content: `Task "${task.title}" is overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++

    // Also notify manager if overdue >= 1 day
    if (daysOverdue >= 1) {
      const managerId = await getUserManager(task.ownerId)
      if (managerId) {
        await createSupervisoryNotification({
          userId: managerId,
          type: NotificationType.TASK_OVERDUE,
          title: "Team member task overdue",
          content: `Task "${task.title}" assigned to ${task.owner.name} is overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`,
          taskId: task.id,
          channel: NotificationChannel.IN_APP,
        })
        count++
      }
    }
  }

  return count
}

/**
 * Scan for tasks with no progress updates in 7 days (TASK_NO_UPDATE)
 */
async function scanNoUpdateTasks(): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - NO_UPDATE_DAYS)

  // Find active tasks without updates in the last 7 days
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS],
      },
    },
    include: {
      owner: { select: { id: true, name: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  let count = 0
  for (const task of tasks) {
    // Check last update date
    const lastUpdateDate = task.updates[0]?.createdAt ?? task.createdAt
    if (lastUpdateDate > cutoffDate) continue

    const alreadySent = await wasNotificationSentRecently(
      task.id,
      NotificationType.TASK_NO_UPDATE
    )
    if (alreadySent) continue

    const daysSinceUpdate = Math.ceil(
      (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_NO_UPDATE,
      title: "Task needs update",
      content: `Task "${task.title}" has not been updated for ${daysSinceUpdate} days`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++
  }

  return count
}

/**
 * Scan for blocked tasks over 2 days (TASK_BLOCKED)
 */
async function scanBlockedTasks(): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - BLOCKED_THRESHOLD_DAYS)

  // Find tasks that are blocked
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: TaskStatus.BLOCKED,
    },
    include: {
      owner: { select: { id: true, name: true } },
      updates: {
        where: { status: TaskStatus.BLOCKED },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  let count = 0
  for (const task of tasks) {
    // Find when task became blocked
    const blockedSince = task.updates[0]?.createdAt ?? task.updatedAt
    if (blockedSince > cutoffDate) continue

    const alreadySent = await wasNotificationSentRecently(
      task.id,
      NotificationType.TASK_BLOCKED
    )
    if (alreadySent) continue

    const daysBlocked = Math.ceil(
      (Date.now() - blockedSince.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Notify owner
    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_BLOCKED,
      title: "Task blocked",
      content: `Task "${task.title}" has been blocked for ${daysBlocked} days`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++

    // Also notify manager
    const managerId = await getUserManager(task.ownerId)
    if (managerId) {
      await createSupervisoryNotification({
        userId: managerId,
        type: NotificationType.TASK_BLOCKED,
        title: "Team member task blocked",
        content: `Task "${task.title}" assigned to ${task.owner.name} has been blocked for ${daysBlocked} days`,
        taskId: task.id,
        channel: NotificationChannel.IN_APP,
      })
      count++
    }
  }

  return count
}

/**
 * Run all supervisory scans
 */
export async function runSupervisoryScan(): Promise<SupervisoryResult> {
  console.log("[Supervisory] Starting scan at", new Date().toISOString())

  const dueSoon = await scanDueSoonTasks()
  console.log(`[Supervisory] Due soon notifications: ${dueSoon}`)

  const overdue = await scanOverdueTasks()
  console.log(`[Supervisory] Overdue notifications: ${overdue}`)

  const noUpdate = await scanNoUpdateTasks()
  console.log(`[Supervisory] No update notifications: ${noUpdate}`)

  const blocked = await scanBlockedTasks()
  console.log(`[Supervisory] Blocked notifications: ${blocked}`)

  const totalNotifications = dueSoon + overdue + noUpdate + blocked
  console.log(`[Supervisory] Total notifications created: ${totalNotifications}`)

  return {
    dueSoon,
    overdue,
    noUpdate,
    blocked,
    totalNotifications,
  }
}

// Stub for WeChat push (M1 - not implemented)
export async function sendWeChatNotification(
  _userId: string,
  _message: string
): Promise<void> {
  // TODO: Implement WeChat push in future milestone
  console.log("[WeChat] Push notification stub - not implemented")
}
