"use client"

import { motion } from "framer-motion"
import { MoreHorizontal, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface List {
  id: string
  name: string
  color: string
  emoji?: string
  taskCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ListItemProps {
  list: List
  isSelected: boolean
  onSelect: (listId: string) => void
  onEdit: (listId: string) => void
  className?: string
}

export function ListItem({
  list,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  className,
}: ListItemProps) {
  return (
    <motion.div
      className={cn(
        "group relative p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer",
        isSelected && "ring-2 ring-primary",
        className
      )}
      onClick={() => onSelect(list.id)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Color Indicator */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.color }}
        />

        {/* Emoji or Icon */}
        <div className="flex-shrink-0">
          {list.emoji ? (
            <span className="text-lg">{list.emoji}</span>
          ) : (
            <Hash className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{list.name}</h3>
          <p className="text-xs text-muted-foreground">
            {list.taskCount} {list.taskCount === 1 ? "task" : "tasks"}
          </p>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(list.id)
            }}
            className="h-6 w-6 p-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}