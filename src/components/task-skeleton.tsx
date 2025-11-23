"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function TaskSkeleton() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-card">
      <div className="flex items-start gap-3">
        {/* Checkbox skeleton */}
        <Skeleton className="h-5 w-5 mt-0.5" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-3/4 mb-2" />

          {/* Description skeleton */}
          <Skeleton className="h-3 w-full mb-3" />
          <Skeleton className="h-3 w-2/3 mb-3" />

          {/* Metadata skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Actions skeleton */}
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  )
}

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  )
}