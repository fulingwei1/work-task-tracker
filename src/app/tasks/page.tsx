"use client";

import { Suspense } from "react";
import { TaskCardSkeleton } from "@/components/task";
import { TasksContent } from "./tasks-content";

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TasksContent />
    </Suspense>
  );
}
