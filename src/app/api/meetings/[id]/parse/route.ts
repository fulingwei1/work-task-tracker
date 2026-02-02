import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseMeetingMinutes } from "@/lib/ai/meeting-parser";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json({ error: "会议不存在" }, { status: 404 });
    }

    const result = await parseMeetingMinutes(meeting.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("解析会议纪要失败:", error);
    return NextResponse.json({ error: "解析会议纪要失败" }, { status: 500 });
  }
}
