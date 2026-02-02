"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meeting/meeting-card";

interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  creator: { id: string; name: string };
  _count: { tasks: number };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/meetings");
      if (!response.ok) throw new Error("获取会议列表失败");
      const data = await response.json();
      setMeetings(data.meetings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加���失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会议纪要</h1>
          <p className="text-gray-500 mt-1">管理会议纪要并使用 AI 智能拆解任务</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <Plus className="h-4 w-4 mr-2" />
            新建会议
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">暂无会议纪要</h3>
          <p className="text-gray-500 mt-1">创建会议纪要后，可以使用 AI 自动拆解任务</p>
          <Button asChild className="mt-4">
            <Link href="/meetings/new">
              <Plus className="h-4 w-4 mr-2" />
              创建第一条会议纪要
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
