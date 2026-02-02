"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface CommentListProps {
  taskId: string
}

export function CommentList({ taskId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取评论列表
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments?limit=50`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [taskId])

  // 提交评论
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.data, ...comments])
        setNewComment("")
      }
    } catch (error) {
      console.error("Failed to create comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取用户名首字母
  const getInitials = (name: string) => {
    return name.substring(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-medium">评论 ({comments.length})</h3>
      </div>

      {/* 评论输入框 */}
      <div className="flex gap-3">
        <Textarea
          placeholder="写下你的评论..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit()
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          size="icon"
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-400">按 Cmd/Ctrl + Enter 发送</p>

      {/* 评论列表 */}
      <div className="space-y-4 mt-4">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无评论</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600">
                  {getInitials(comment.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(comment.createdAt), "MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
