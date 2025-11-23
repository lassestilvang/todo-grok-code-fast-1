"use client"

import { motion } from "framer-motion"
import { Eye, List, Tag, CheckSquare, Plus, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  id: string
  name: string
  count?: number
  overdueCount?: number
  color?: string
  icon?: string
}

export interface SidebarProps {
  lists: SidebarItem[]
  views: SidebarItem[]
  labels: SidebarItem[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelectList: (id: string) => void
  onSelectView: (id: string) => void
  onSelectLabel: (id: string) => void
  selectedListId?: string
  selectedViewId?: string
  selectedLabelId?: string
  showCompleted: boolean
  onToggleShowCompleted: () => void
  onCreateList?: () => void
  onCreateLabel?: () => void
}

interface SidebarSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: SidebarItem[]
  isCollapsed: boolean
  selectedId?: string
  onSelect: (id: string) => void
  onCreate?: () => void
  showCreateButton?: boolean
}

function SidebarSection({
  title,
  icon: Icon,
  items,
  isCollapsed,
  selectedId,
  onSelect,
  onCreate,
  showCreateButton = false
}: SidebarSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          )}
        </div>
        {showCreateButton && !isCollapsed && onCreate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreate}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      {!isCollapsed && (
        <div className="space-y-1">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={cn(
                "group relative p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer",
                selectedId === item.id && "bg-accent ring-1 ring-primary/20"
              )}
              onClick={() => onSelect(item.id)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                {/* Color Indicator for labels */}
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {/* Icon for lists */}
                {item.icon && (
                  <div className="flex-shrink-0">
                    {item.icon.startsWith('http') ? (
                      <img src={item.icon} alt="" className="w-4 h-4" />
                    ) : (
                      <span className="text-sm">{item.icon}</span>
                    )}
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {item.overdueCount && item.overdueCount > 0 && (
                        <span className="text-xs text-red-500 font-medium">
                          {item.overdueCount}
                        </span>
                      )}
                      {item.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  lists,
  views,
  labels,
  isCollapsed,
  onToggleCollapse,
  onSelectList,
  onSelectView,
  onSelectLabel,
  selectedListId,
  selectedViewId,
  selectedLabelId,
  showCompleted,
  onToggleShowCompleted,
  onCreateList,
  onCreateLabel,
}: SidebarProps) {
  return (
    <div className={cn(
      "h-full bg-background border-r border-border transition-all duration-300",
      isCollapsed ? "w-12" : "w-64"
    )}>
      <div className="p-4">
        {/* Lists Section */}
        <SidebarSection
          title="Lists"
          icon={List}
          items={lists}
          isCollapsed={isCollapsed}
          selectedId={selectedListId}
          onSelect={onSelectList}
          onCreate={onCreateList}
          showCreateButton={true}
        />

        {/* Views Section */}
        <SidebarSection
          title="Views"
          icon={Eye}
          items={views}
          isCollapsed={isCollapsed}
          selectedId={selectedViewId}
          onSelect={onSelectView}
        />
        {selectedViewId && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 py-2"
          >
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-completed" className="text-sm text-muted-foreground">
                Show completed
              </Label>
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={onToggleShowCompleted}
              />
            </div>
          </motion.div>
        )}

        {/* Labels Section */}
        <SidebarSection
          title="Labels"
          icon={Tag}
          items={labels}
          isCollapsed={isCollapsed}
          selectedId={selectedLabelId}
          onSelect={onSelectLabel}
          onCreate={onCreateLabel}
          showCreateButton={true}
        />
      </div>
    </div>
  )
}