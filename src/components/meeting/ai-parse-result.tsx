"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, User, Calendar, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

interface AiParseResultProps {
  meetingId: string;
  tasks: ParsedTask[];
  users: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EditableTask extends ParsedTask {
  selected: boolean;
  ownerId: string;
  dueDate: string;
}

export function AiParseResult({
  meetingId,
  tasks,
  users,
  onSuccess,
  onCancel,
}: AiParseResultProps) {
  const router = useRouter();
  const [editableTasks, setEditableTasks] = useState<EditableTask[]>(() =>
    tasks.map((task) => ({
      ...task,
      selected: true,
      ownerId: users.find((u) => u.name === task.suggestedOwnerName)?.id || "",
      dueDate: task.suggestedDueDate || "",
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedCount = editableTasks.filter((t) => t.selected).length;

  const updateTask = (index: number, updates: Partial<EditableTask>) => {
    setEditableTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updates } : task))
    );
  };

  const toggleAll = (selected: boolean) => {
    setEditableTasks((prev) => prev.map((task) => ({ ...task, selected })));
  };

  const handleSubmit = async () => {
    const selectedTasks = editableTasks.filter((t) => t.selected);

    if (selectedTasks.length === 0) {
      setError("请至少选择一个任务");
      return;
    }

    const invalidTasks = selectedTasks.filter((t) => !t.ownerId);
    if (invalidTasks.length > 0) {
      setError("请为所有选中的任务指定负责人");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/meetings/${meetingId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: selectedTasks.map((t) => ({
            title: t.title,
            ownerId: t.ownerId,
            priority: t.priority,
            dueDate: t.dueDate || undefined,
            acceptanceCriteria: t.acceptanceCriteria,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "创建任务失败");
      }

      onSuccess?.();
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建任务失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-yellow-100 text-yellow-700",
    P3: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AI 识别结果</h3>
          <p className="text-sm text-gray-500">
            共识别 {tasks.length} 个任务，已选择 {selectedCount} 个
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
            取消全选
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {editableTasks.map((task, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-colors ${
              task.selected
                ? "border-indigo-200 bg-indigo-50/30"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.selected}
                onCheckedChange={(checked) =>
                  updateTask(index, { selected: !!checked })
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(index, { title: e.target.value })}
                    className="font-medium"
                    disabled={!task.selected}
                  />
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      priorityColors[task.priority]
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3" />
                      负责人
                    </Label>
                    <Select
                      value={task.ownerId}
                      onValueChange={(value) =>
                        updateTask(index, { ownerId: value })
                      }
                      disabled={!task.selected}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择负责人" />
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

                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      截止日期
                    </Label>
                    <Input
                      type="date"
                      value={task.dueDate}
                      onChange={(e) =>
                        updateTask(index, { dueDate: e.target.value })
                      }
                      disabled={!task.selected}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      优先级
                    </Label>
                    <Select
                      value={task.priority}
                      onValueChange={(value: "P1" | "P2" | "P3") =>
                        updateTask(index, { priority: value })
                      }
                      disabled={!task.selected}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1 - 高优先级</SelectItem>
                        <SelectItem value="P2">P2 - 中优先级</SelectItem>
                        <SelectItem value="P3">P3 - 低优先级</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>置信度: {Math.round(task.confidence * 100)}%</span>
                  {task.suggestedOwnerName && (
                    <span>AI 建议负责人: {task.suggestedOwnerName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-2" />
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || selectedCount === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              创建中...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              创建 {selectedCount} 个任务
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
