import { NextRequest } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { successSingle, errorResponse, notFound, forbidden } from "@/lib/api/response"
import { EvidenceType } from "@prisma/client"

// DELETE /api/evidences/[id] - 删除证据
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession()
  if (!session) {
    return errorResponse("Unauthorized", 401)
  }

  const { id } = params

  // 查找证据
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: {
      task: {
        select: { ownerId: true, createdBy: true },
      },
    },
  })

  if (!evidence) {
    return notFound("Evidence not found")
  }

  // 权限检查：只有上传者、任务负责人、任务创建者可以删除
  const canDelete =
    evidence.userId === session.id ||
    evidence.task.ownerId === session.id ||
    evidence.task.createdBy === session.id ||
    session.role === "ADMIN" ||
    session.role === "CEO" ||
    session.role === "DIRECTOR"

  if (!canDelete) {
    return forbidden("没有权限删除此证据")
  }

  // 如果是文件类型，删除物理文件
  if (
    (evidence.type === EvidenceType.FILE || evidence.type === EvidenceType.IMAGE) &&
    evidence.url.startsWith("/uploads/")
  ) {
    const filePath = path.join(process.cwd(), "public", evidence.url)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch (error) {
        console.error("Failed to delete file:", error)
        // 继续删除数据库记录
      }
    }
  }

  // 删除数据库记录
  await prisma.evidence.delete({
    where: { id },
  })

  return successSingle({ deleted: true })
}
