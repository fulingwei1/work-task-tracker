"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface NotificationTask {
  id: string
  title: string
}

interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  task: NotificationTask | null
}

interface NotificationsResponse {
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "刚刚"
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString("zh-CN")
}

function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    TASK_ASSIGNED: "任务分配",
    TASK_DUE_SOON: "即将到期",
    TASK_OVERDUE: "已逾期",
    TASK_NO_UPDATE: "无更新",
    TASK_BLOCKED: "已阻塞",
    TASK_STATUS_CHANGED: "状态变更",
  }
  return labels[type] || type
}

function getNotificationTypeColor(type: string): string {
  const colors: Record<string, string> = {
    TASK_ASSIGNED: "bg-blue-100 text-blue-700",
    TASK_DUE_SOON: "bg-yellow-100 text-yellow-700",
    TASK_OVERDUE: "bg-red-100 text-red-700",
    TASK_NO_UPDATE: "bg-orange-100 text-orange-700",
    TASK_BLOCKED: "bg-purple-100 text-purple-700",
    TASK_STATUS_CHANGED: "bg-green-100 text-green-700",
  }
  return colors[type] || "bg-gray-100 text-gray-700"
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch("/api/notifications")
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      const data: NotificationsResponse = await response.json()
      setNotifications(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button
            variant="outline"
            onClick={fetchNotifications}
            className="mt-4"
          >
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} 条未读通知`
              : "已阅读全部通知"}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleMarkAllAsRead}
          disabled={markingAllRead || unreadCount === 0}
          className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          全部标记已读
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Bell className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">暂无通知</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !notification.isRead ? "bg-indigo-50/30" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.isRead ? "bg-gray-300" : "bg-indigo-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getNotificationTypeColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        标记已读
                      </button>
                    )}
                    {notification.task && (
                      <Link
                        href={`/tasks?id=${notification.task.id}`}
                        onClick={() => {
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.id)
                          }
                        }}
                        className="inline-flex items-center text-xs text-gray-500 hover:text-indigo-600 font-medium"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        查看任务
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
