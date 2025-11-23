"use client"

import { motion } from "framer-motion"
import { Check, Clock, Flag, MoreHorizontal, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type Priority = "low" | "medium" | "high" | "urgent"

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: Priority
  dueDate?: Date
  labels: string[]
  subtasks: Subtask[]
  hasAttachments: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskItemProps {
  task: Task
  onToggleComplete: (taskId: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onEdit: (taskId: string) => void
  className?: string
}

export function TaskItem({
  task,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  className,
}: TaskItemProps) {
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length
  const totalSubtasks = task.subtasks.length

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "low":
        return "text-blue-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-orange-500"
      case "urgent":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case "low":
        return <Flag className="h-3 w-3" />
      case "medium":
        return <Flag className="h-3 w-3" />
      case "high":
        return <Flag className="h-3 w-3" />
      case "urgent":
        return <Flag className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <motion.div
      className={cn(
        "group relative p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors",
        task.completed && "opacity-60",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-0.5"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "text-sm font-medium leading-tight",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div className="mt-2 space-y-1">
              {task.subtasks.slice(0, 3).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                    className="h-3 w-3"
                  />
                  <span
                    className={cn(
                      "text-xs",
                      subtask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
              {totalSubtasks > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{totalSubtasks - 3} more subtasks
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2">
            {/* Priority */}
            <div className={cn("flex items-center gap-1", getPriorityColor(task.priority))}>
              {getPriorityIcon(task.priority)}
              <span className="text-xs capitalize">{task.priority}</span>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.dueDate.toLocaleDateString()}
              </div>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex gap-1">
                {task.labels.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
                  >
                    {label}
                  </span>
                ))}
                {task.labels.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{task.labels.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Attachments */}
            {task.hasAttachments && (
              <Paperclip className="h-3 w-3 text-muted-foreground" />
            )}

            {/* Subtask Progress */}
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" />
                {completedSubtasks}/{totalSubtasks}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task.id)}
            className="h-6 w-6 p-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}