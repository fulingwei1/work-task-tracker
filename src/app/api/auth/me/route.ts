import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

// GET /api/auth/me - Get current user info
export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.json({ data: session })
}
