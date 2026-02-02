import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types";

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md";
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; dotColor: string }> = {
  P1: {
    label: "P1",
    className: "bg-red-50 text-red-600",
    dotColor: "bg-red-500",
  },
  P2: {
    label: "P2",
    className: "bg-amber-50 text-amber-600",
    dotColor: "bg-amber-500",
  },
  P3: {
    label: "P3",
    className: "bg-gray-100 text-gray-600",
    dotColor: "bg-gray-400",
  },
};

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  return <div className={cn("w-1 h-8 rounded-full", config.dotColor)} />;
}
