/**
 * 企业微信 API 集成模块
 * 包含 Access Token 管理和消息推送功能
 */

// Access Token 缓存
let accessTokenCache: {
  token: string
  expiresAt: number
} | null = null

/**
 * 获取企业微信配置
 */
function getWeChatConfig() {
  const corpId = process.env.WECHAT_CORP_ID
  const agentId = process.env.WECHAT_AGENT_ID
  const secret = process.env.WECHAT_SECRET

  return { corpId, agentId, secret }
}

/**
 * 检查企业微信是否已配置
 */
export function isWeChatConfigured(): boolean {
  const { corpId, agentId, secret } = getWeChatConfig()
  return !!(corpId && agentId && secret)
}

/**
 * 获取 Access Token（带缓存）
 */
export async function getAccessToken(): Promise<string | null> {
  const { corpId, secret } = getWeChatConfig()

  if (!corpId || !secret) {
    console.log("[WeChat] Not configured, skipping token fetch")
    return null
  }

  // 检查缓存是否有效（提前 5 分钟过期）
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return accessTokenCache.token
  }

  try {
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${secret}`
    )
    const data = await response.json()

    if (data.errcode !== 0) {
      console.error("[WeChat] Failed to get access token:", data.errmsg)
      return null
    }

    // 缓存 token
    accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }

    console.log("[WeChat] Access token refreshed")
    return data.access_token
  } catch (error) {
    console.error("[WeChat] Error fetching access token:", error)
    return null
  }
}

/**
 * 发送文本消息
 */
export async function sendTextMessage(
  toUser: string,
  content: string
): Promise<boolean> {
  const { agentId } = getWeChatConfig()
  const accessToken = await getAccessToken()

  if (!accessToken || !agentId) {
    console.log("[WeChat] Cannot send message - not configured")
    return false
  }

  try {
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touser: toUser,
          msgtype: "text",
          agentid: parseInt(agentId),
          text: { content },
        }),
      }
    )
    const data = await response.json()

    if (data.errcode !== 0) {
      console.error("[WeChat] Failed to send message:", data.errmsg)
      return false
    }

    console.log(`[WeChat] Message sent to ${toUser}`)
    return true
  } catch (error) {
    console.error("[WeChat] Error sending message:", error)
    return false
  }
}

/**
 * 发送文本卡片消息（更美观，支持跳转）
 */
export async function sendTextCardMessage(params: {
  toUser: string
  title: string
  description: string
  url: string
  btnText?: string
}): Promise<boolean> {
  const { agentId } = getWeChatConfig()
  const accessToken = await getAccessToken()

  if (!accessToken || !agentId) {
    console.log("[WeChat] Cannot send card message - not configured")
    return false
  }

  try {
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touser: params.toUser,
          msgtype: "textcard",
          agentid: parseInt(agentId),
          textcard: {
            title: params.title,
            description: params.description,
            url: params.url,
            btntxt: params.btnText || "查看详情",
          },
        }),
      }
    )
    const data = await response.json()

    if (data.errcode !== 0) {
      console.error("[WeChat] Failed to send card message:", data.errmsg)
      return false
    }

    console.log(`[WeChat] Card message sent to ${params.toUser}`)
    return true
  } catch (error) {
    console.error("[WeChat] Error sending card message:", error)
    return false
  }
}

/**
 * 任务提醒消息模板
 */
export interface TaskReminderParams {
  wxUserId: string
  taskId: string
  taskTitle: string
  daysInfo: string // e.g., "还剩 2 天" 或 "已逾期 3 天"
  status: string
}

export async function sendTaskReminderMessage(params: TaskReminderParams): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const taskUrl = `${appUrl}/tasks/${params.taskId}`

  return sendTextCardMessage({
    toUser: params.wxUserId,
    title: "📋 任务提醒",
    description: `<div class="gray">任务：${params.taskTitle}</div>` +
      `<div class="normal">状态：${params.status}</div>` +
      `<div class="highlight">${params.daysInfo}</div>`,
    url: taskUrl,
    btnText: "更新进度",
  })
}

/**
 * 任务逾期警告消息（发送给负责人和主管）
 */
export interface TaskOverdueParams {
  wxUserId: string
  taskId: string
  taskTitle: string
  ownerName: string
  daysOverdue: number
  lastUpdateDays?: number
}

export async function sendTaskOverdueMessage(params: TaskOverdueParams): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const taskUrl = `${appUrl}/tasks/${params.taskId}`

  let description = `<div class="highlight">任务：${params.taskTitle}</div>` +
    `<div class="normal">负责人：${params.ownerName}</div>` +
    `<div class="gray">已逾期：${params.daysOverdue} 天</div>`

  if (params.lastUpdateDays) {
    description += `<div class="gray">最近更新：${params.lastUpdateDays} 天前</div>`
  }

  return sendTextCardMessage({
    toUser: params.wxUserId,
    title: "⚠️ 逾期警告",
    description,
    url: taskUrl,
    btnText: "查看详情",
  })
}

/**
 * 任务分配通知
 */
export async function sendTaskAssignedMessage(params: {
  wxUserId: string
  taskId: string
  taskTitle: string
  creatorName: string
  dueDate?: string
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const taskUrl = `${appUrl}/tasks/${params.taskId}`

  let description = `<div class="normal">${params.creatorName} 给您分配了新任务</div>` +
    `<div class="highlight">任务：${params.taskTitle}</div>`

  if (params.dueDate) {
    description += `<div class="gray">截止日期：${params.dueDate}</div>`
  }

  return sendTextCardMessage({
    toUser: params.wxUserId,
    title: "📌 新任务",
    description,
    url: taskUrl,
    btnText: "查看任务",
  })
}

/**
 * 阻塞通知
 */
export async function sendTaskBlockedMessage(params: {
  wxUserId: string
  taskId: string
  taskTitle: string
  ownerName: string
  daysBlocked: number
  blockerDesc?: string
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const taskUrl = `${appUrl}/tasks/${params.taskId}`

  let description = `<div class="highlight">任务：${params.taskTitle}</div>` +
    `<div class="normal">负责人：${params.ownerName}</div>` +
    `<div class="gray">阻塞时长：${params.daysBlocked} 天</div>`

  if (params.blockerDesc) {
    description += `<div class="gray">阻塞原因：${params.blockerDesc}</div>`
  }

  return sendTextCardMessage({
    toUser: params.wxUserId,
    title: "🚫 任务阻塞",
    description,
    url: taskUrl,
    btnText: "协助处理",
  })
}
