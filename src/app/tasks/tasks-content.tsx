"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TaskCard,
  TaskCardSkeleton,
  TaskFilters,
  ProgressUpdateDialog,
} from "@/components/task";
import type {
  TaskListItem,
  ApiListResponse,
  TaskStatus,
  TaskPriority,
  ProgressUpdateFormData,
} from "@/types";

const ITEMS_PER_PAGE = 10;

export function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const initialStatus = (searchParams.get("status") as TaskStatus | "ALL") || "ALL";
  const initialPriority = (searchParams.get("priority") as TaskPriority | "ALL") || "ALL";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "ALL">(initialStatus);
  const [priority, setPriority] = useState<TaskPriority | "ALL">(initialPriority);
  const [page, setPage] = useState(initialPage);

  // Progress update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));

      if (status !== "ALL") {
        params.set("status", status);
      }
      if (priority !== "ALL") {
        params.set("priority", priority);
      }

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data: ApiListResponse<TaskListItem> = await res.json();
        setTasks(data.data);
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, priority]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (priority !== "ALL") params.set("priority", priority);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    const newUrl = queryString ? `/tasks?${queryString}` : "/tasks";
    router.replace(newUrl, { scroll: false });
  }, [status, priority, page, router]);

  // Filter handlers
  const handleStatusChange = (value: TaskStatus | "ALL") => {
    setStatus(value);
    setPage(1);
  };

  const handlePriorityChange = (value: TaskPriority | "ALL") => {
    setPriority(value);
    setPage(1);
  };

  // Task actions
  const handleUpdateProgress = (task: TaskListItem) => {
    setSelectedTask(task);
    setUpdateDialogOpen(true);
  };

  const handleProgressSubmit = async (data: ProgressUpdateFormData) => {
    if (!selectedTask) return;

    const res = await fetch(`/api/tasks/${selectedTask.id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await fetchTasks();
    }
  };

  // Pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  // Filter tasks by search (client-side for now)
  const filteredTasks = search
    ? tasks.filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      )
    : tasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track all your tasks</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={handleStatusChange}
          priority={priority}
          onPriorityChange={handlePriorityChange}
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No tasks found</p>
            {(status !== "ALL" || priority !== "ALL" || search) && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => {
                  setStatus("ALL");
                  setPriority("ALL");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => router.push(`/tasks/${task.id}/edit`)}
              onUpdateProgress={() => handleUpdateProgress(task)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(page * ITEMS_PER_PAGE, total)} of {total} tasks
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrevious}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Progress Update Dialog */}
      {selectedTask && (
        <ProgressUpdateDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          taskTitle={selectedTask.title}
          currentProgress={selectedTask.latestProgress ?? 0}
          currentStatus={selectedTask.status}
          onSubmit={handleProgressSubmit}
        />
      )}
    </div>
  );
}
