"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard, TaskCard, TaskCardSkeleton, ProgressUpdateDialog } from "@/components/task";
import type { TaskListItem, ApiListResponse, DashboardStats, ProgressUpdateFormData } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    inProgress: 0,
    dueSoon: 0,
    overdue: 0,
  });
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Progress update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pending and in-progress tasks
        const [pendingRes, inProgressRes, allTasksRes] = await Promise.all([
          fetch("/api/tasks?status=NOT_STARTED&limit=100"),
          fetch("/api/tasks?status=IN_PROGRESS&limit=100"),
          fetch("/api/tasks?limit=10"),
        ]);

        const pendingData: ApiListResponse<TaskListItem> = await pendingRes.json();
        const inProgressData: ApiListResponse<TaskListItem> = await inProgressRes.json();
        const allTasksData: ApiListResponse<TaskListItem> = await allTasksRes.json();

        // Calculate stats
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let dueSoonCount = 0;
        let overdueCount = 0;

        const allTasks = [...pendingData.data, ...inProgressData.data];
        allTasks.forEach((task) => {
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (dueDate < now && task.status !== "COMPLETED") {
              overdueCount++;
            } else if (dueDate <= oneWeekFromNow && task.status !== "COMPLETED") {
              dueSoonCount++;
            }
          }
        });

        setStats({
          pending: pendingData.meta.total,
          inProgress: inProgressData.meta.total,
          dueSoon: dueSoonCount,
          overdue: overdueCount,
        });

        setTasks(allTasksData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
      // Refresh tasks
      const tasksRes = await fetch("/api/tasks?limit=10");
      const tasksData = await tasksRes.json();
      setTasks(tasksData.data);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, here is your task overview</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Tasks"
          value={stats.pending}
          icon={ClipboardList}
          color="primary"
          href="/tasks?status=NOT_STARTED"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="blue"
          href="/tasks?status=IN_PROGRESS"
        />
        <StatCard
          title="Due This Week"
          value={stats.dueSoon}
          icon={AlertTriangle}
          color="warning"
          href="/tasks?dueBefore=7"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="danger"
          href="/tasks?overdue=true"
        />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          <Link
            href="/tasks"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks yet</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/tasks/new">Create your first task</Link>
              </Button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => window.location.href = `/tasks/${task.id}/edit`}
                onUpdateProgress={() => handleUpdateProgress(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          )}
        </div>
      </div>

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
