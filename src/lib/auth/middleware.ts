import { NextRequest, NextResponse } from "next/server"
import { getSession, SessionUser } from "./session"

export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  context: { user: SessionUser; params?: T }
) => Promise<NextResponse>

export function withAuth<T = unknown>(handler: AuthenticatedHandler<T>) {
  return async (request: NextRequest, context?: { params?: T }) => {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return handler(request, { user: session, params: context?.params })
  }
}

export function withRole<T = unknown>(
  roles: SessionUser["role"][],
  handler: AuthenticatedHandler<T>
) {
  return withAuth<T>(async (request, context) => {
    if (!roles.includes(context.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return handler(request, context)
  })
}
