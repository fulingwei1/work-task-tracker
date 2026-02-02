import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  NOT_STARTED: {
    label: "未开始",
    className: "bg-gray-100 text-gray-600",
  },
  IN_PROGRESS: {
    label: "进行中",
    className: "bg-blue-50 text-blue-600",
  },
  PENDING_REVIEW: {
    label: "待审核",
    className: "bg-amber-50 text-amber-600",
  },
  COMPLETED: {
    label: "已完成",
    className: "bg-emerald-50 text-emerald-600",
  },
  BLOCKED: {
    label: "已阻塞",
    className: "bg-red-50 text-red-600",
  },
  CANCELLED: {
    label: "已取消",
    className: "bg-gray-100 text-gray-400",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
