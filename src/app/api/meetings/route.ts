import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.meeting.count(),
    ]);

    return NextResponse.json({
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取会议列表失败:", error);
    return NextResponse.json({ error: "获取会议列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        content,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("创建会议失败:", error);
    return NextResponse.json({ error: "创建会议失败" }, { status: 500 });
  }
}
