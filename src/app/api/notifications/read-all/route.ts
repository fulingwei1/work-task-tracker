import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import { serverError } from "@/lib/api/response"
import { NextResponse } from "next/server"

// PATCH /api/notifications/read-all - Mark all notifications as read
export const PATCH = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Update all unread notifications for the current user
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      data: { count: result.count },
    })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return serverError("Failed to mark all notifications as read")
  }
})
