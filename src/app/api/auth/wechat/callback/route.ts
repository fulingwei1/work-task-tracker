import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

// GET /api/auth/wechat/callback - OAuth callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    )
  }

  const wechatCorpId = process.env.WECHAT_CORP_ID
  const wechatSecret = process.env.WECHAT_SECRET

  // If WeChat config is not set, use mock callback
  if (!wechatCorpId || !wechatSecret) {
    // For M1: simulate callback with mock user
    let mockUser = await prisma.user.findFirst({
      where: { wxUserId: "mock_user_001" },
    })

    if (!mockUser) {
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

    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    )
  }

  // Production: Exchange code for access token and get user info
  try {
    // Step 1: Get access token
    const tokenResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${wechatCorpId}&corpsecret=${wechatSecret}`
    )
    const tokenData = await tokenResponse.json()

    if (tokenData.errcode !== 0) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      )
    }

    const accessToken = tokenData.access_token

    // Step 2: Get user info from code
    const userInfoResponse = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${accessToken}&code=${code}`
    )
    const userInfo = await userInfoResponse.json()

    if (userInfo.errcode !== 0) {
      return NextResponse.json(
        { error: "Failed to get user info" },
        { status: 500 }
      )
    }

    const wxUserId = userInfo.userid

    // Step 3: Find or create user in database
    let user = await prisma.user.findUnique({
      where: { wxUserId },
    })

    if (!user) {
      // Fetch detailed user info from WeChat
      const detailResponse = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${wxUserId}`
      )
      const detailData = await detailResponse.json()

      user = await prisma.user.create({
        data: {
          wxUserId,
          name: detailData.name || wxUserId,
          role: "STAFF",
        },
      })
    }

    await createSession(user.id)

    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    )
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
