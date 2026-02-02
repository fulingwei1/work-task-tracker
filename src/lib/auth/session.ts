import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import type { User } from "@prisma/client"

const SESSION_COOKIE_NAME = "session_user_id"

export interface SessionUser {
  id: string
  name: string
  role: User["role"]
  departmentId: string | null
  wxUserId: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      departmentId: true,
      wxUserId: true,
    },
  })

  return user
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
