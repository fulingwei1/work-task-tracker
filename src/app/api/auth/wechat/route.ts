import { NextResponse } from "next/server"
import { getSession, createSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

// GET /api/auth/wechat - Initiate WeChat OAuth (Mock for M1)
export async function GET() {
  // In M1, we use a mock login flow
  // In production, this would redirect to WeChat OAuth URL

  const wechatCorpId = process.env.WECHAT_CORP_ID
  const wechatAgentId = process.env.WECHAT_AGENT_ID
  const redirectUri = process.env.WECHAT_OAUTH_REDIRECT_URI

  // If WeChat config is not set, use mock login
  if (!wechatCorpId || !wechatAgentId) {
    // For M1 development: create or get a mock user and log them in
    let mockUser = await prisma.user.findFirst({
      where: { wxUserId: "mock_user_001" },
    })

    if (!mockUser) {
      // Create a mock department first
      let mockDept = await prisma.department.findFirst({
        where: { wxDeptId: "mock_dept_001" },
      })

      if (!mockDept) {
        mockDept = await prisma.department.create({
          data: {
            wxDeptId: "mock_dept_001",
            name: "Engineering",
          },
        })
      }

      mockUser = await prisma.user.create({
        data: {
          wxUserId: "mock_user_001",
          name: "Test User",
          role: "STAFF",
          departmentId: mockDept.id,
        },
      })
    }

    await createSession(mockUser.id)

    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }

  // Production: Redirect to WeChat OAuth
  const state = Math.random().toString(36).substring(7)
  const oauthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wechatCorpId}&redirect_uri=${encodeURIComponent(redirectUri || "")}&response_type=code&scope=snsapi_base&state=${state}&agentid=${wechatAgentId}#wechat_redirect`

  return NextResponse.redirect(oauthUrl)
}
