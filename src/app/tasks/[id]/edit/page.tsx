"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/task";
import type { TaskFormData, TaskDetail, ApiSingleResponse } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTaskPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch task
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

  const handleSubmit = async (data: TaskFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          collaboratorIds: data.collaboratorIds,
          dueDate: data.dueDate,
          priority: data.priority,
          acceptanceCriteria: data.acceptanceCriteria,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      router.push(`/tasks/${id}`);
    } catch (err) {
      console.error("Failed to update task:", err);
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Button variant="ghost" asChild>
          <Link href="/tasks">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/tasks/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Task
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        <p className="text-gray-500 mt-1">Update task details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {task && (
          <TaskForm
            initialData={task}
            onSubmit={handleSubmit}
            isLoading={isSaving}
          />
        )}
      </div>
    </div>
  );
}
