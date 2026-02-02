"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Upload,
  X,
  Download,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Evidence {
  id: string
  type: "FILE" | "IMAGE" | "LINK" | "TEXT"
  filename: string | null
  url: string
  mimeType: string | null
  size: number | null
  description: string | null
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface EvidenceListProps {
  taskId: string
}

export function EvidenceList({ taskId }: EvidenceListProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 表单状态
  const [linkUrl, setLinkUrl] = useState("")
  const [textContent, setTextContent] = useState("")
  const [description, setDescription] = useState("")

  // 获取证据列表
  const fetchEvidences = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/evidences`)
      if (res.ok) {
        const data = await res.json()
        setEvidences(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch evidences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidences()
  }, [taskId])

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (description) {
        formData.append("description", description)
      }

      const res = await fetch(`/api/tasks/${taskId}/evidences`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setEvidences([data.data, ...evidences])
        setDialogOpen(false)
        setDescription("")
      } else {
        const error = await res.json()
        alert(error.error || "上传失败")
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("上传失败")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 添加链接
  const handleAddLink = async () => {
    if (!linkUrl.trim()) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("url", linkUrl.trim())
      if (description) {
        formData.append("description", description)
      }

      const res = await fetch(`/api/tasks/${taskId}/evidences`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setEvidences([data.data, ...evidences])
        setDialogOpen(false)
        setLinkUrl("")
        setDescription("")
      } else {
        const error = await res.json()
        alert(error.error || "添加失败")
      }
    } catch (error) {
      console.error("Failed to add link:", error)
      alert("添加失败")
    } finally {
      setIsUploading(false)
    }
  }

  // 添加文本
  const handleAddText = async () => {
    if (!textContent.trim()) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("text", textContent.trim())
      if (description) {
        formData.append("description", description)
      }

      const res = await fetch(`/api/tasks/${taskId}/evidences`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setEvidences([data.data, ...evidences])
        setDialogOpen(false)
        setTextContent("")
        setDescription("")
      } else {
        const error = await res.json()
        alert(error.error || "添加失败")
      }
    } catch (error) {
      console.error("Failed to add text:", error)
      alert("添加失败")
    } finally {
      setIsUploading(false)
    }
  }

  // 删除证据
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个证据吗？")) return

    try {
      const res = await fetch(`/api/evidences/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setEvidences(evidences.filter((e) => e.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete evidence:", error)
    }
  }

  // 格式化文件大小
  const formatSize = (bytes: number | null) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 获取图标
  const getIcon = (type: Evidence["type"]) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className="w-4 h-4" />
      case "LINK":
        return <LinkIcon className="w-4 h-4" />
      case "TEXT":
        return <FileText className="w-4 h-4" />
      default:
        return <Paperclip className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Paperclip className="w-5 h-5" />
          <h3 className="font-medium">证据材料 ({evidences.length})</h3>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              添加证据
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加证据材料</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="file" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">上传文件</TabsTrigger>
                <TabsTrigger value="link">添加链接</TabsTrigger>
                <TabsTrigger value="text">文本说明</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    支持图片、PDF、Office 文档、压缩包等，最大 10MB
                  </p>
                </div>
                <Textarea
                  placeholder="添加说明（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </TabsContent>

              <TabsContent value="link" className="space-y-4 mt-4">
                <Input
                  placeholder="输入链接地址"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <Textarea
                  placeholder="添加说明（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim() || isUploading}
                  className="w-full"
                >
                  添加链接
                </Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 mt-4">
                <Textarea
                  placeholder="输入文本内容"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={4}
                />
                <Textarea
                  placeholder="添加说明（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleAddText}
                  disabled={!textContent.trim() || isUploading}
                  className="w-full"
                >
                  添加文本
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* 证据列表 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : evidences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>暂无证据材料</p>
          </div>
        ) : (
          evidences.map((evidence) => (
            <div
              key={evidence.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              <div className="p-2 bg-white rounded-md text-gray-500">
                {getIcon(evidence.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {evidence.type === "IMAGE" && (
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline truncate"
                    >
                      {evidence.filename || "图片"}
                    </a>
                  )}
                  {evidence.type === "FILE" && (
                    <a
                      href={evidence.url}
                      download={evidence.filename}
                      className="font-medium text-indigo-600 hover:underline truncate"
                    >
                      {evidence.filename || "文件"}
                    </a>
                  )}
                  {evidence.type === "LINK" && (
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline truncate"
                    >
                      {evidence.url}
                    </a>
                  )}
                  {evidence.type === "TEXT" && (
                    <span className="font-medium text-gray-900 truncate">
                      文本记录
                    </span>
                  )}
                  {evidence.size && (
                    <span className="text-xs text-gray-400">
                      {formatSize(evidence.size)}
                    </span>
                  )}
                </div>
                {evidence.type === "TEXT" && (
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-3">
                    {evidence.url}
                  </p>
                )}
                {evidence.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {evidence.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{evidence.user.name}</span>
                  <span>·</span>
                  <span>
                    {format(new Date(evidence.createdAt), "MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(evidence.type === "FILE" || evidence.type === "IMAGE") && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={evidence.url} download={evidence.filename}>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {evidence.type === "LINK" && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(evidence.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
