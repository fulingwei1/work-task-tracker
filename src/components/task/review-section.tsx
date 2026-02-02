"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Send,
  Star,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Review {
  id: string
  result: "PASS" | "FAIL"
  failReason: string | null
  rating: "EXCELLENT" | "QUALIFIED" | "RISK" | "UNQUALIFIED" | null
  ratingReason: string | null
  suggestions: string | null
  createdAt: string
  reviewer: {
    id: string
    name: string
  }
}

interface ReviewSectionProps {
  taskId: string
  taskStatus: string
  isOwner: boolean
  canReview: boolean
  onStatusChange?: () => void
}

export function ReviewSection({
  taskId,
  taskStatus,
  isOwner,
  canReview,
  onStatusChange,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表单状态
  const [result, setResult] = useState<"PASS" | "FAIL" | "">("")
  const [failReason, setFailReason] = useState("")
  const [rating, setRating] = useState("")
  const [ratingReason, setRatingReason] = useState("")
  const [suggestions, setSuggestions] = useState("")

  // 获取验收记录
  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [taskId])

  // 提交验收请求
  const handleSubmitForReview = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit-review`, {
        method: "POST",
      })

      if (res.ok) {
        onStatusChange?.()
        alert("任务已提交验收")
      } else {
        const error = await res.json()
        alert(error.error || "提交失败")
      }
    } catch (error) {
      console.error("Failed to submit for review:", error)
      alert("提交失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提交验收结果
  const handleSubmitReview = async () => {
    if (!result) {
      alert("请选择验收结果")
      return
    }

    if (result === "FAIL" && !failReason.trim()) {
      alert("验收不通过时请填写原因")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          failReason: result === "FAIL" ? failReason : null,
          rating: rating || null,
          ratingReason: ratingReason || null,
          suggestions: suggestions || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setReviews([data.data, ...reviews])
        setDialogOpen(false)
        resetForm()
        onStatusChange?.()
      } else {
        const error = await res.json()
        alert(error.error || "提交失败")
      }
    } catch (error) {
      console.error("Failed to submit review:", error)
      alert("提交失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setResult("")
    setFailReason("")
    setRating("")
    setRatingReason("")
    setSuggestions("")
  }

  // 评级标签和颜色
  const getRatingInfo = (rating: Review["rating"]) => {
    switch (rating) {
      case "EXCELLENT":
        return { label: "优秀", color: "text-green-600 bg-green-50" }
      case "QUALIFIED":
        return { label: "达标", color: "text-blue-600 bg-blue-50" }
      case "RISK":
        return { label: "风险", color: "text-yellow-600 bg-yellow-50" }
      case "UNQUALIFIED":
        return { label: "不达标", color: "text-red-600 bg-red-50" }
      default:
        return null
    }
  }

  const isPendingReview = taskStatus === "PENDING_REVIEW"
  const isCompleted = taskStatus === "COMPLETED"
  const canSubmitForReview = isOwner && !isPendingReview && !isCompleted && taskStatus !== "CANCELLED"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <ClipboardCheck className="w-5 h-5" />
          <h3 className="font-medium">验收记录 ({reviews.length})</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* 负责人提交验收按钮 */}
          {canSubmitForReview && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              提交验收
            </Button>
          )}

          {/* 验收按钮 */}
          {canReview && isPendingReview && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  进行验收
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>任务验收</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* 验收结果 */}
                  <div className="space-y-2">
                    <Label>验收结果 *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={result === "PASS" ? "default" : "outline"}
                        className={result === "PASS" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => setResult("PASS")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        通过
                      </Button>
                      <Button
                        type="button"
                        variant={result === "FAIL" ? "default" : "outline"}
                        className={result === "FAIL" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => setResult("FAIL")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        不通过
                      </Button>
                    </div>
                  </div>

                  {/* 不通过原因 */}
                  {result === "FAIL" && (
                    <div className="space-y-2">
                      <Label>不通过原因 *</Label>
                      <Textarea
                        placeholder="请填写不通过的原因..."
                        value={failReason}
                        onChange={(e) => setFailReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* 质量评级（通过时可选） */}
                  {result === "PASS" && (
                    <div className="space-y-2">
                      <Label>质量评级（可选）</Label>
                      <Select value={rating} onValueChange={setRating}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择评级" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXCELLENT">
                            <span className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-green-500" />
                              优秀
                            </span>
                          </SelectItem>
                          <SelectItem value="QUALIFIED">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              达标
                            </span>
                          </SelectItem>
                          <SelectItem value="RISK">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              风险
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 评级说明 */}
                  {rating && (
                    <div className="space-y-2">
                      <Label>评级说明（可选）</Label>
                      <Textarea
                        placeholder="请简述评级原因..."
                        value={ratingReason}
                        onChange={(e) => setRatingReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  {/* 改进建议 */}
                  <div className="space-y-2">
                    <Label>改进建议（可选）</Label>
                    <Textarea
                      placeholder="给任务执行者一些改进建议..."
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={!result || isSubmitting}
                    className="w-full"
                  >
                    提交验收
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 状态提示 */}
      {isPendingReview && !canReview && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          任务已提交验收，等待验收人审核
        </div>
      )}

      {/* 验收记录列表 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>暂无验收记录</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-lg border ${
                review.result === "PASS"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {review.result === "PASS" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      review.result === "PASS" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {review.result === "PASS" ? "验收通过" : "验收不通过"}
                  </span>
                  {review.rating && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        getRatingInfo(review.rating)?.color
                      }`}
                    >
                      {getRatingInfo(review.rating)?.label}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(review.createdAt), "yyyy-MM-dd HH:mm", {
                    locale: zhCN,
                  })}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                <p>验收人：{review.reviewer.name}</p>
              </div>

              {review.failReason && (
                <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                  <span className="font-medium text-red-700">不通过原因：</span>
                  <span className="text-gray-700">{review.failReason}</span>
                </div>
              )}

              {review.ratingReason && (
                <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                  <span className="font-medium text-gray-700">评级说明：</span>
                  <span className="text-gray-600">{review.ratingReason}</span>
                </div>
              )}

              {review.suggestions && (
                <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                  <span className="font-medium text-gray-700">改进建议：</span>
                  <span className="text-gray-600">{review.suggestions}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
