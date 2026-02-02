"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  StatusBadge,
  PriorityBadge,
  ProgressRing,
  ProgressUpdateDialog,
} from "@/components/task";
import type { TaskDetail, ApiSingleResponse, ProgressUpdateFormData } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string | null, includeTime = false): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  if (includeTime) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progress update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  // Fetch task details
  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Task not found");
          } else {
            setError("Failed to load task");
          }
          return;
        }

        const data: ApiSingleResponse<TaskDetail> = await res.json();
        setTask(data.data);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        setError("Failed to load task");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTask();
  }, [id]);

  const handleProgressSubmit = async (data: ProgressUpdateFormData) => {
    const res = await fetch(`/api/tasks/${id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Refetch task
      const taskRes = await fetch(`/api/tasks/${id}`);
      const taskData = await taskRes.json();
      setTask(taskData.data);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/tasks");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/tasks">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{error || "Task not found"}</p>
        </div>
      </div>
    );
  }

  const latestProgress = task.updates[0]?.progressPercent ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/tasks">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setUpdateDialogOpen(true)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Progress
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tasks/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Task Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>
          <ProgressRing progress={latestProgress} size={64} strokeWidth={4} />
        </div>

        <Separator className="my-4" />

        {/* Task Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Owner</p>
            <p className="font-medium flex items-center gap-1">
              <User className="w-4 h-4 text-gray-400" />
              {task.owner.name}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Due Date</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(task.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Created By</p>
            <p className="font-medium">{task.creator.name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Created</p>
            <p className="font-medium">{formatDate(task.createdAt)}</p>
          </div>
        </div>

        {/* Acceptance Criteria */}
        {task.acceptanceCriteria && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Acceptance Criteria
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {task.acceptanceCriteria}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Updates Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Progress Updates
        </h2>

        {task.updates.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No updates yet</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setUpdateDialogOpen(true)}
            >
              Add the first update
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {task.updates.map((update, index) => (
              <div
                key={update.id}
                className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-transparent"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-indigo-500" />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {update.user.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getRelativeTime(update.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-indigo-600">
                        {update.progressPercent}%
                      </span>
                      {update.status && (
                        <StatusBadge status={update.status} size="sm" />
                      )}
                    </div>
                    {update.nextAction && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Next:</span> {update.nextAction}
                      </p>
                    )}
                    {update.blockerDesc && (
                      <p className="text-sm text-red-600 mt-2">
                        <span className="font-medium">Blocked:</span> {update.blockerDesc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Update Dialog */}
      <ProgressUpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        taskTitle={task.title}
        currentProgress={latestProgress}
        currentStatus={task.status}
        onSubmit={handleProgressSubmit}
      />
    </div>
  );
}
