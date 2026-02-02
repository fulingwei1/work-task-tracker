"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FileText, User, Calendar, ListTodo, MoreVertical, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    createdAt: string;
    creator: {
      id: string;
      name: string;
    };
    _count: {
      tasks: number;
    };
  };
  onDelete?: (id: string) => void;
}

export function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const handleDelete = () => {
    if (confirm("确定要删除这条会议纪要吗？")) {
      onDelete?.(meeting.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/meetings/${meeting.id}`}
              className="text-lg font-medium text-gray-900 hover:text-indigo-600 line-clamp-1"
            >
              {meeting.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {meeting.creator.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(meeting.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
              <span className="flex items-center gap-1">
                <ListTodo className="h-4 w-4" />
                {meeting._count.tasks} 个任务
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/meetings/${meeting.id}`} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                查看详情
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
