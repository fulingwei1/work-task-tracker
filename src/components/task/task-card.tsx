"use client";

import Link from "next/link";
import { Calendar, User, MoreHorizontal, Edit, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-badge";
import { ProgressRing } from "./progress-ring";
import type { TaskListItem } from "@/types";

interface TaskCardProps {
  task: TaskListItem;
  onEdit?: () => void;
  onUpdateProgress?: () => void;
  onDelete?: () => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({ task, onEdit, onUpdateProgress, onDelete }: TaskCardProps) {
  const progress = task.latestProgress ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        {/* Left: Priority indicator */}
        <div className="flex items-center gap-3">
          <PriorityIndicator priority={task.priority} />
        </div>

        {/* Middle: Task content */}
        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
            {task.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {task.owner.name}
            </span>
          </div>
        </Link>

        {/* Right: Status + Progress + Actions */}
        <div className="flex items-center gap-4">
          <StatusBadge status={task.status} />
          <ProgressRing progress={progress} size={36} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUpdateProgress}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// Skeleton for loading state
export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 animate-pulse">
      <div className="w-1 h-8 bg-gray-200 rounded" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded-full" />
      <div className="w-9 h-9 bg-gray-200 rounded-full" />
    </div>
  );
}
