import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { TaskPriority } from "@prisma/client";

interface TaskData {
  title: string;
  ownerId: string;
  priority: TaskPriority;
  dueDate?: string;
  acceptanceCriteria?: string;
}

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
    const body = await request.json();
    const { tasks } = body as { tasks: TaskData[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "任务列表不能为空" }, { status: 400 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json({ error: "会议不存在" }, { status: 404 });
    }

    const createdTasks = await prisma.$transaction(
      tasks.map((task) =>
        prisma.task.create({
          data: {
            title: task.title,
            ownerId: task.ownerId,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            acceptanceCriteria: task.acceptanceCriteria,
            source: "MEETING",
            sourceMeetingId: id,
            createdBy: session.id,
          },
          include: {
            owner: { select: { id: true, name: true } },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("批量创建任务失败:", error);
    return NextResponse.json({ error: "批量创建任务失败" }, { status: 500 });
  }
}
