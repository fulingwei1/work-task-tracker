import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import {
  successList,
  serverError,
  parsePagination,
} from "@/lib/api/response"
import { Prisma } from "@prisma/client"

// GET /api/notifications - List current user's notifications
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    // Build filter conditions
    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
    }

    // Filter by isRead if provided
    const isReadParam = searchParams.get("isRead")
    if (isReadParam !== null) {
      where.isRead = isReadParam === "true"
    }

    // Execute queries in parallel
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          task: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return successList(notifications, { total, page, limit })
  } catch (error) {
    console.error("Failed to list notifications:", error)
    return serverError("Failed to list notifications")
  }
})
