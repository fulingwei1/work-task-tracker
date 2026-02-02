"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
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
import type { TaskPriority, UserBasic, TaskFormData, TaskDetail } from "@/types";

interface TaskFormProps {
  initialData?: TaskDetail;
  onSubmit: (data: TaskFormData) => Promise<void>;
  isLoading?: boolean;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "P1", label: "P1 - 高优先级" },
  { value: "P2", label: "P2 - 中优先级" },
  { value: "P3", label: "P3 - 低优先级" },
];

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function TaskForm({ initialData, onSubmit, isLoading }: TaskFormProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [ownerId, setOwnerId] = useState(initialData?.ownerId ?? "");
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(
    initialData?.collaboratorIds ?? []
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialData?.priority ?? "P2"
  );
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(
    initialData?.acceptanceCriteria ?? ""
  );

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const json = await res.json();
          setUsers(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: TaskFormData = {
      title: title.trim(),
      ownerId,
      collaboratorIds,
      dueDate: dueDate ? formatDateForInput(dueDate) : null,
      priority,
      acceptanceCriteria: acceptanceCriteria.trim() || null,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          标题 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入任务标题"
          required
        />
      </div>

      {/* Owner */}
      <div className="space-y-2">
        <Label htmlFor="owner">
          负责人 <span className="text-red-500">*</span>
        </Label>
        <Select value={ownerId} onValueChange={setOwnerId} required>
          <SelectTrigger>
            <SelectValue placeholder={loadingUsers ? "加载中..." : "选择负责人"} />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">优先级</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
          <SelectTrigger>
            <SelectValue />
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

      {/* Due Date */}
      <div className="space-y-2">
        <Label>截止日期</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? dueDate.toLocaleDateString() : "选择日期"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Acceptance Criteria */}
      <div className="space-y-2">
        <Label htmlFor="acceptanceCriteria">验收标准</Label>
        <Textarea
          id="acceptanceCriteria"
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder="完成此任务需要满足哪些条件？"
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading || !title.trim() || !ownerId}>
          {isLoading ? "保存中..." : initialData ? "更新任务" : "创建任务"}
        </Button>
      </div>
    </form>
  );
}
