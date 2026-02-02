import { prisma } from "@/lib/db"
import { NotificationType, NotificationChannel, TaskStatus } from "@prisma/client"
import {
  isWeChatConfigured,
  sendTaskReminderMessage,
  sendTaskOverdueMessage,
  sendTaskBlockedMessage,
} from "@/lib/wechat"

const DEDUP_WINDOW_HOURS = 24
const DUE_SOON_DAYS = 2
const NO_UPDATE_DAYS = 7
const BLOCKED_THRESHOLD_DAYS = 2
const OVERDUE_REPEAT_DAYS = 3 // 逾期超过3天后，每3天提醒一次

interface SupervisoryResult {
  dueSoon: number
  overdue: number
  noUpdate: number
  blocked: number
  wechatSent: number
  totalNotifications: number
}

/**
 * Check if a notification was already sent for this task/type within the dedup window
 */
async function wasNotificationSentRecently(
  taskId: string,
  triggerType: NotificationType,
  channel?: NotificationChannel
): Promise<boolean> {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - DEDUP_WINDOW_HOURS)

  const where: {
    taskId: string
    triggerType: NotificationType
    sentAt: { gte: Date }
    channel?: NotificationChannel
  } = {
    taskId,
    triggerType,
    sentAt: { gte: cutoff },
  }

  if (channel) {
    where.channel = channel
  }

  const existing = await prisma.notificationLog.findFirst({ where })
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

  // Create in-app notification
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
async function getUserManager(userId: string): Promise<{ id: string; wxUserId: string | null } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          users: {
            where: { role: "MANAGER" },
            take: 1,
            select: { id: true, wxUserId: true },
          },
        },
      },
    },
  })

  if (!user?.department?.users?.[0]) {
    return null
  }

  const manager = user.department.users[0]
  return manager.id !== userId ? manager : null
}

/**
 * Get user with wxUserId
 */
async function getUserWithWxId(userId: string): Promise<{ id: string; wxUserId: string | null; name: string } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, wxUserId: true, name: true },
  })
}

/**
 * 状态中文映射
 */
function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    NOT_STARTED: "未开始",
    IN_PROGRESS: "进行中",
    PENDING_REVIEW: "待验收",
    COMPLETED: "已完成",
    BLOCKED: "已阻塞",
    CANCELLED: "已取消",
  }
  return labels[status] || status
}

/**
 * Scan for tasks due within 2 days (TASK_DUE_SOON)
 * 截止前2天：站内通知
 * 截止当天：企业微信 + 站内
 */
async function scanDueSoonTasks(): Promise<{ count: number; wechat: number }> {
  const now = new Date()
  const dueSoonDate = new Date()
  dueSoonDate.setDate(dueSoonDate.getDate() + DUE_SOON_DAYS)

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
      owner: { select: { id: true, name: true, wxUserId: true } },
    },
  })

  let count = 0
  let wechatCount = 0

  for (const task of tasks) {
    const alreadySent = await wasNotificationSentRecently(
      task.id,
      NotificationType.TASK_DUE_SOON
    )
    if (alreadySent) continue

    const daysLeft = Math.ceil(
      (task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const isDueToday = daysLeft <= 1

    // 站内通知
    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_DUE_SOON,
      title: isDueToday ? "任务今日截止" : "任务即将到期",
      content: `任务「${task.title}」${isDueToday ? "今日截止" : `还剩 ${daysLeft} 天截止`}`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++

    // 截止当天发送企业微信
    if (isDueToday && isWeChatConfigured() && task.owner.wxUserId) {
      const sent = await sendTaskReminderMessage({
        wxUserId: task.owner.wxUserId,
        taskId: task.id,
        taskTitle: task.title,
        daysInfo: "⏰ 今日截止",
        status: getStatusLabel(task.status),
      })
      if (sent) {
        wechatCount++
        await prisma.notificationLog.create({
          data: {
            taskId: task.id,
            triggerType: NotificationType.TASK_DUE_SOON,
            channel: NotificationChannel.WECHAT,
          },
        })
      }
    }
  }

  return { count, wechat: wechatCount }
}

/**
 * Scan for overdue tasks (TASK_OVERDUE)
 * 逾期第1天：企业微信 + 站内（负责人 + 主管）
 * 逾期超过3天：每3天提醒一次
 */
async function scanOverdueTasks(): Promise<{ count: number; wechat: number }> {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      dueDate: { lt: now },
      status: {
        notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      },
    },
    include: {
      owner: { select: { id: true, name: true, wxUserId: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  let count = 0
  let wechatCount = 0

  for (const task of tasks) {
    const daysOverdue = Math.ceil(
      (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 检查是否需要发送（逾期超过3天时，每3天发一次）
    let shouldSend = false
    if (daysOverdue <= OVERDUE_REPEAT_DAYS) {
      const alreadySent = await wasNotificationSentRecently(
        task.id,
        NotificationType.TASK_OVERDUE
      )
      shouldSend = !alreadySent
    } else {
      // 超过3天，检查是否是3的倍数天
      if (daysOverdue % OVERDUE_REPEAT_DAYS === 0) {
        const alreadySent = await wasNotificationSentRecently(
          task.id,
          NotificationType.TASK_OVERDUE
        )
        shouldSend = !alreadySent
      }
    }

    if (!shouldSend) continue

    const lastUpdateDate = task.updates[0]?.createdAt ?? task.createdAt
    const lastUpdateDays = Math.ceil(
      (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 站内通知给负责人
    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_OVERDUE,
      title: "任务已逾期",
      content: `任务「${task.title}」已逾期 ${daysOverdue} 天`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++

    // 通知主管
    const manager = await getUserManager(task.ownerId)
    if (manager) {
      await createSupervisoryNotification({
        userId: manager.id,
        type: NotificationType.TASK_OVERDUE,
        title: "团队成员任务逾期",
        content: `${task.owner.name} 的任务「${task.title}」已逾期 ${daysOverdue} 天`,
        taskId: task.id,
        channel: NotificationChannel.IN_APP,
      })
      count++
    }

    // 企业微信推送
    if (isWeChatConfigured()) {
      // 通知负责人
      if (task.owner.wxUserId) {
        const sent = await sendTaskOverdueMessage({
          wxUserId: task.owner.wxUserId,
          taskId: task.id,
          taskTitle: task.title,
          ownerName: task.owner.name,
          daysOverdue,
          lastUpdateDays,
        })
        if (sent) {
          wechatCount++
          await prisma.notificationLog.create({
            data: {
              taskId: task.id,
              triggerType: NotificationType.TASK_OVERDUE,
              channel: NotificationChannel.WECHAT,
            },
          })
        }
      }

      // 通知主管
      if (manager?.wxUserId) {
        const sent = await sendTaskOverdueMessage({
          wxUserId: manager.wxUserId,
          taskId: task.id,
          taskTitle: task.title,
          ownerName: task.owner.name,
          daysOverdue,
          lastUpdateDays,
        })
        if (sent) wechatCount++
      }
    }
  }

  return { count, wechat: wechatCount }
}

/**
 * Scan for tasks with no progress updates in 7 days (TASK_NO_UPDATE)
 * 7天未更新：站内通知
 */
async function scanNoUpdateTasks(): Promise<{ count: number; wechat: number }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - NO_UPDATE_DAYS)

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS],
      },
    },
    include: {
      owner: { select: { id: true, name: true, wxUserId: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  let count = 0

  for (const task of tasks) {
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
      title: "任务需要更新",
      content: `任务「${task.title}」已 ${daysSinceUpdate} 天未更新进度`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++
  }

  return { count, wechat: 0 }
}

/**
 * Scan for blocked tasks over 2 days (TASK_BLOCKED)
 * 阻塞超过2天：企业微信 + 站内（负责人 + 主管）
 */
async function scanBlockedTasks(): Promise<{ count: number; wechat: number }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - BLOCKED_THRESHOLD_DAYS)

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: TaskStatus.BLOCKED,
    },
    include: {
      owner: { select: { id: true, name: true, wxUserId: true } },
      updates: {
        where: { status: TaskStatus.BLOCKED },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, blockerDesc: true },
      },
    },
  })

  let count = 0
  let wechatCount = 0

  for (const task of tasks) {
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
    const blockerDesc = task.updates[0]?.blockerDesc ?? undefined

    // 站内通知给负责人
    await createSupervisoryNotification({
      userId: task.ownerId,
      type: NotificationType.TASK_BLOCKED,
      title: "任务阻塞",
      content: `任务「${task.title}」已阻塞 ${daysBlocked} 天`,
      taskId: task.id,
      channel: NotificationChannel.IN_APP,
    })
    count++

    // 通知主管
    const manager = await getUserManager(task.ownerId)
    if (manager) {
      await createSupervisoryNotification({
        userId: manager.id,
        type: NotificationType.TASK_BLOCKED,
        title: "团队成员任务阻塞",
        content: `${task.owner.name} 的任务「${task.title}」已阻塞 ${daysBlocked} 天`,
        taskId: task.id,
        channel: NotificationChannel.IN_APP,
      })
      count++
    }

    // 企业微信推送
    if (isWeChatConfigured()) {
      // 通知负责人
      if (task.owner.wxUserId) {
        const sent = await sendTaskBlockedMessage({
          wxUserId: task.owner.wxUserId,
          taskId: task.id,
          taskTitle: task.title,
          ownerName: task.owner.name,
          daysBlocked,
          blockerDesc,
        })
        if (sent) {
          wechatCount++
          await prisma.notificationLog.create({
            data: {
              taskId: task.id,
              triggerType: NotificationType.TASK_BLOCKED,
              channel: NotificationChannel.WECHAT,
            },
          })
        }
      }

      // 通知主管
      if (manager?.wxUserId) {
        const sent = await sendTaskBlockedMessage({
          wxUserId: manager.wxUserId,
          taskId: task.id,
          taskTitle: task.title,
          ownerName: task.owner.name,
          daysBlocked,
          blockerDesc,
        })
        if (sent) wechatCount++
      }
    }
  }

  return { count, wechat: wechatCount }
}

/**
 * Run all supervisory scans
 */
export async function runSupervisoryScan(): Promise<SupervisoryResult> {
  console.log("[Supervisory] Starting scan at", new Date().toISOString())
  console.log("[Supervisory] WeChat configured:", isWeChatConfigured())

  const dueSoonResult = await scanDueSoonTasks()
  console.log(`[Supervisory] Due soon: ${dueSoonResult.count} notifications, ${dueSoonResult.wechat} wechat`)

  const overdueResult = await scanOverdueTasks()
  console.log(`[Supervisory] Overdue: ${overdueResult.count} notifications, ${overdueResult.wechat} wechat`)

  const noUpdateResult = await scanNoUpdateTasks()
  console.log(`[Supervisory] No update: ${noUpdateResult.count} notifications`)

  const blockedResult = await scanBlockedTasks()
  console.log(`[Supervisory] Blocked: ${blockedResult.count} notifications, ${blockedResult.wechat} wechat`)

  const totalNotifications =
    dueSoonResult.count + overdueResult.count + noUpdateResult.count + blockedResult.count
  const totalWechat =
    dueSoonResult.wechat + overdueResult.wechat + blockedResult.wechat

  console.log(`[Supervisory] Total: ${totalNotifications} notifications, ${totalWechat} wechat messages`)

  return {
    dueSoon: dueSoonResult.count,
    overdue: overdueResult.count,
    noUpdate: noUpdateResult.count,
    blocked: blockedResult.count,
    wechatSent: totalWechat,
    totalNotifications,
  }
}
