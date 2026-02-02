"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TaskStatus, ProgressUpdateFormData } from "@/types";

interface ProgressUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  currentProgress: number;
  currentStatus: TaskStatus;
  onSubmit: (data: ProgressUpdateFormData) => Promise<void>;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "未开始" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "COMPLETED", label: "已完成" },
  { value: "BLOCKED", label: "已阻塞" },
];

const blockerTypeOptions = [
  { value: "DEPENDENCY", label: "等待依赖" },
  { value: "RESOURCE", label: "资源不可用" },
  { value: "TECHNICAL", label: "技术阻塞" },
  { value: "EXTERNAL", label: "外部依赖" },
  { value: "OTHER", label: "其他" },
];

export function ProgressUpdateDialog({
  open,
  onOpenChange,
  taskTitle,
  currentProgress,
  currentStatus,
  onSubmit,
}: ProgressUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(currentProgress);
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [blockerType, setBlockerType] = useState<string>("");
  const [blockerDesc, setBlockerDesc] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: ProgressUpdateFormData = {
        progressPercent,
        status,
        blockerType: status === "BLOCKED" ? blockerType : undefined,
        blockerDesc: status === "BLOCKED" ? blockerDesc : undefined,
        nextAction: nextAction.trim() || undefined,
        estimatedCompletion: estimatedCompletion?.toISOString(),
      };

      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>更新进度</DialogTitle>
          <DialogDescription className="truncate">
            {taskTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <Label htmlFor="progress">
              进度: {progressPercent}%
            </Label>
            <Input
              id="progress"
              type="range"
              min={0}
              max={100}
              value={progressPercent}
              onChange={(e) => setProgressPercent(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blocker fields (shown when status is BLOCKED) */}
          {status === "BLOCKED" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="blockerType">阻塞类型</Label>
                <Select value={blockerType} onValueChange={setBlockerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择阻塞类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockerTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockerDesc">阻塞描述</Label>
                <Textarea
                  id="blockerDesc"
                  value={blockerDesc}
                  onChange={(e) => setBlockerDesc(e.target.value)}
                  placeholder="描述阻塞情况..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Next Action */}
          <div className="space-y-2">
            <Label htmlFor="nextAction">下一步行动</Label>
            <Input
              id="nextAction"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="下一步是什么？"
            />
          </div>

          {/* Estimated Completion */}
          <div className="space-y-2">
            <Label>预计完成时间</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !estimatedCompletion && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {estimatedCompletion
                    ? estimatedCompletion.toLocaleDateString()
                    : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={estimatedCompletion}
                  onSelect={setEstimatedCompletion}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
