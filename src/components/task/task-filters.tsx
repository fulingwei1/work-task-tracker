"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskStatus, TaskPriority } from "@/types";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "ALL";
  onStatusChange: (value: TaskStatus | "ALL") => void;
  priority: TaskPriority | "ALL";
  onPriorityChange: (value: TaskPriority | "ALL") => void;
}

const statusOptions: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部状态" },
  { value: "NOT_STARTED", label: "未开始" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "COMPLETED", label: "已完成" },
  { value: "BLOCKED", label: "已阻塞" },
  { value: "CANCELLED", label: "已取消" },
];

const priorityOptions: { value: TaskPriority | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部优先级" },
  { value: "P1", label: "P1 - 高" },
  { value: "P2", label: "P2 - 中" },
  { value: "P3", label: "P3 - 低" },
];

export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="搜索任务..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as TaskStatus | "ALL")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priority} onValueChange={(v) => onPriorityChange(v as TaskPriority | "ALL")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="全部优先级" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
