import { NextResponse } from "next/server"
import { destroySession } from "@/lib/auth/session"

// POST /api/auth/logout - Log out current user
export async function POST() {
  await destroySession()

  return NextResponse.json({ success: true, message: "Logged out successfully" })
}
