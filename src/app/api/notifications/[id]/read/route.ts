import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import {
  successSingle,
  notFound,
  forbidden,
  serverError,
} from "@/lib/api/response"

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/notifications/[id]/read - Mark a single notification as read
export const PATCH = withAuth<RouteContext["params"]>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!

      // Find the notification
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { id: true, userId: true },
      })

      if (!notification) {
        return notFound("Notification not found")
      }

      // Check ownership
      if (notification.userId !== user.id) {
        return forbidden("You can only mark your own notifications as read")
      }

      // Update the notification
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
        include: {
          task: {
            select: { id: true, title: true },
          },
        },
      })

      return successSingle(updated)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      return serverError("Failed to mark notification as read")
    }
  }
)
