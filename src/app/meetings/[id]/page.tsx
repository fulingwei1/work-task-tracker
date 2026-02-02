"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Wand2, Loader2, FileText, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiParseResult } from "@/components/meeting/ai-parse-result";

interface Meeting {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  creator: { id: string; name: string };
  tasks: Array<{
    id: string;
    title: string;
    owner: { id: string; name: string };
  }>;
}

interface ParsedTask {
  title: string;
  suggestedOwnerName?: string;
  suggestedDueDate?: string;
  priority: "P1" | "P2" | "P3";
  acceptanceCriteria?: string;
  confidence: number;
}

interface User {
  id: string;
  name: string;
}

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetingRes, usersRes] = await Promise.all([
          fetch(`/api/meetings/${id}`),
          fetch("/api/users"),
        ]);

        if (!meetingRes.ok) throw new Error("获取会议详情失败");

        const meetingData = await meetingRes.json();
        setMeeting(meetingData);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleParse = async () => {
    setIsParsing(true);
    setError("");

    try {
      const response = await fetch(`/api/meetings/${id}/parse`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("解析失败");

      const data = await response.json();
      setParsedTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 解析失败");
    } finally {
      setIsParsing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回会议列表
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-gray-500 mt-1">
              由 {meeting.creator.name} 创建于{" "}
              {new Date(meeting.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
          {!parsedTasks && (
            <Button onClick={handleParse} disabled={isParsing}>
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI 解析中...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI 智能拆解
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {parsedTasks ? (
        <div className="bg-white rounded-lg border p-6">
          <AiParseResult
            meetingId={id}
            tasks={parsedTasks}
            users={users}
            onCancel={() => setParsedTasks(null)}
            onSuccess={() => {}}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              会议纪要内容
            </h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-600">
              {meeting.content}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
              <ListTodo className="h-5 w-5" />
              已拆解任务 ({meeting.tasks.length})
            </h2>
            {meeting.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无已拆解任务</p>
                <p className="text-sm mt-1">点击"AI 智能拆解"按钮开始</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {meeting.tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        负责人: {task.owner.name}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
