import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { successSingle, successList, errorResponse, notFound, badRequest } from "@/lib/api/response"
import { EvidenceType } from "@prisma/client"

// 上传目录
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  // 图片
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // 文档
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // 压缩包
  "application/zip",
  "application/x-rar-compressed",
  // 文本
  "text/plain",
  "text/csv",
]

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// GET /api/tasks/[id]/evidences - 获取任务证据列表
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

  const evidences = await prisma.evidence.findMany({
    where: { taskId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return successList(evidences, {
    total: evidences.length,
    page: 1,
    limit: evidences.length,
  })
}

// POST /api/tasks/[id]/evidences - 上传证据
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
  })

  if (!task) {
    return notFound("Task not found")
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const linkUrl = formData.get("url") as string | null
    const textContent = formData.get("text") as string | null
    const description = formData.get("description") as string | null

    // 确定证据类型
    let evidenceType: EvidenceType
    let url: string
    let filename: string | null = null
    let mimeType: string | null = null
    let size: number | null = null

    if (file && file.size > 0) {
      // 文件上传
      if (file.size > MAX_FILE_SIZE) {
        return badRequest(`文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return badRequest("不支持的文件类型")
      }

      // 判断是图片还是普通文件
      evidenceType = file.type.startsWith("image/")
        ? EvidenceType.IMAGE
        : EvidenceType.FILE

      // 确保上传目录存在
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true })
      }

      // 生成唯一文件名
      const ext = path.extname(file.name)
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
      const filePath = path.join(UPLOAD_DIR, uniqueName)

      // 写入文件
      const bytes = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(bytes))

      url = `/uploads/${uniqueName}`
      filename = file.name
      mimeType = file.type
      size = file.size
    } else if (linkUrl) {
      // 链接类型
      evidenceType = EvidenceType.LINK
      url = linkUrl

      // 简单验证 URL 格式
      try {
        new URL(linkUrl)
      } catch {
        return badRequest("无效的链接地址")
      }
    } else if (textContent) {
      // 文本类型
      evidenceType = EvidenceType.TEXT
      url = textContent // 文本内容存在 url 字段
    } else {
      return badRequest("请提供文件、链接或文本")
    }

    // 创建证据记录
    const evidence = await prisma.evidence.create({
      data: {
        taskId,
        userId: session.id,
        type: evidenceType,
        url,
        filename,
        mimeType,
        size,
        description: description?.trim() || null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return successSingle(evidence)
  } catch (error) {
    console.error("Failed to upload evidence:", error)
    return errorResponse("上传失败", 500)
  }
}
