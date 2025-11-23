"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ListForm } from "@/components/list-form"
import { LabelForm } from "@/components/label-form"
import { TaskForm } from "@/components/task-form"
import { TaskItem } from "@/components/task-item"
import { SearchBar } from "@/components/search-bar"
import { Menu, Zap } from "lucide-react"
import { TaskListSkeleton } from "@/components/task-skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { ErrorBoundary } from "@/components/error-boundary"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { parseNaturalLanguage } from "@/lib/natural-language-parser"

interface List {
  id: string
  name: string
  color: string
  emoji?: string
  taskCount: number
  overdueCount: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: Date
  deadline?: Date
  estimate?: string
  actual?: string
  overdue: boolean
  recurring: {
    enabled: boolean
    frequency: "daily" | "weekly" | "monthly"
    interval: number
  }
  labels: string[]
  subtasks: {
    id: string
    title: string
    completed: boolean
  }[]
  hasAttachments: boolean
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const [lists, setLists] = useState<List[]>([])
  const [labels, setLabels] = useState<any[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedListId, setSelectedListId] = useState<string>()
  const [selectedViewId, setSelectedViewId] = useState<string>()
  const [selectedLabelId, setSelectedLabelId] = useState<string>()
  const [sidebarViews, setSidebarViews] = useState([
    { id: 'today', name: 'Today', count: 0, overdueCount: 0 },
    { id: 'next7days', name: 'Next 7 Days', count: 0, overdueCount: 0 },
    { id: 'upcoming', name: 'Upcoming', count: 0, overdueCount: 0 },
    { id: 'all', name: 'All Tasks', count: 0, overdueCount: 0 }
  ])
  const [showCompleted, setShowCompleted] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | undefined>()
  const [isCreateLabelDialogOpen, setIsCreateLabelDialogOpen] = useState(false)
  const [editingLabel, setEditingLabel] = useState<any | undefined>()
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [quickAddInput, setQuickAddInput] = useState("")

  const toggleSidebar = () => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(() => {
        setIsCollapsed(!isCollapsed)
      })
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data)
        if (!selectedListId && data.length > 0) {
          setSelectedListId(data[0].id)
        }
      } else {
        toast.error('Failed to load lists')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      toast.error('Failed to load lists')
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels')
      if (response.ok) {
        const data = await response.json()
        setLabels(data)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  const fetchTasks = async () => {
    setIsLoadingTasks(true)
    if (!selectedListId && !selectedViewId && !selectedLabelId && !searchQuery) {
      setIsLoadingTasks(false)
      return
    }
    try {
      let url = '/api/tasks?'
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&showCompleted=${showCompleted}`
      } else if (selectedViewId) {
        url += `view=${selectedViewId}&showCompleted=${showCompleted}`
      } else if (selectedLabelId) {
        url += `labelId=${selectedLabelId}`
      } else {
        url += `listId=${selectedListId}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else {
        toast.error('Failed to load tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const fetchViewCounts = async () => {
    const views = ['today', 'next7days', 'upcoming', 'all']
    const counts: { [key: string]: number } = {}
    const overdueCounts: { [key: string]: number } = {}

    for (const view of views) {
      try {
        const response = await fetch(`/api/tasks?view=${view}&showCompleted=false`)
        if (response.ok) {
          const data = await response.json()
          counts[view] = data.length
          overdueCounts[view] = data.filter((task: Task) => task.overdue).length
        }
      } catch (error) {
        console.error(`Error fetching count for ${view}:`, error)
        counts[view] = 0
        overdueCounts[view] = 0
      }
    }

    setSidebarViews(prev => prev.map(view => ({
      ...view,
      count: counts[view.id] || 0,
      overdueCount: overdueCounts[view.id] || 0
    })))
  }

  useEffect(() => {
    fetchLists()
    fetchLabels()
    fetchViewCounts()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [selectedListId, selectedViewId, selectedLabelId, showCompleted, searchQuery])

  const handleCreateList = async (data: { name: string; color: string; emoji?: string }) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchLists()
        setIsCreateListDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const handleEditList = async (data: { name: string; color: string; emoji?: string }) => {
    if (!editingList) return
    try {
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchLists()
        setEditingList(undefined)
      }
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const handleCreateLabel = async (data: { name: string; color: string }) => {
    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchLabels()
        setIsCreateLabelDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating label:', error)
    }
  }

  const handleEditLabel = async (data: { name: string; color: string }) => {
    if (!editingLabel) return
    try {
      const response = await fetch(`/api/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchLabels()
        setEditingLabel(undefined)
      }
    } catch (error) {
      console.error('Error updating label:', error)
    }
  }

  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, listId: selectedListId })
      })
      if (response.ok) {
        await fetchTasks()
        setIsCreateTaskDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleEditTask = async (data: any) => {
    if (!editingTask) return
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchTasks()
        setEditingTask(undefined)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: task.completed ? 'pending' : 'completed' })
      })
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    // For simplicity, refetch tasks
    await fetchTasks()
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setIsSearchMode(query.length > 0)
    if (query.length > 0) {
      // Clear selections when searching
      setSelectedListId(undefined)
      setSelectedViewId(undefined)
      setSelectedLabelId(undefined)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setIsSearchMode(false)
  }

  const handleQuickAdd = async () => {
    if (!quickAddInput.trim() || !selectedListId) return

    try {
      const parsed = parseNaturalLanguage(quickAddInput)
      const taskData = {
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        labels: parsed.labels,
        listId: selectedListId,
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        await fetchTasks()
        setQuickAddInput("")
        toast.success('Task created successfully!')
      } else {
        toast.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const sidebarLists = lists.map(list => ({
    id: list.id,
    name: list.name,
    icon: list.emoji,
    color: list.color,
    count: list.taskCount,
    overdueCount: list.overdueCount
  }))

  const sidebarLabels = labels.map(label => ({
    id: label.id,
    name: label.name,
    color: label.color,
    count: label.taskCount
  }))

  return (
    <ErrorBoundary>
      <div className="flex h-screen">
        <Sidebar
          lists={sidebarLists}
          views={sidebarViews}
          labels={sidebarLabels}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          onSelectList={(id) => {
            setSelectedListId(id)
            setSelectedViewId(undefined)
            setSelectedLabelId(undefined)
          }}
          onSelectView={(id) => {
            setSelectedViewId(id)
            setSelectedListId(undefined)
            setSelectedLabelId(undefined)
          }}
          onSelectLabel={(id) => {
            setSelectedLabelId(id)
            setSelectedListId(undefined)
            setSelectedViewId(undefined)
          }}
          selectedListId={selectedListId}
          selectedViewId={selectedViewId}
          selectedLabelId={selectedLabelId}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
          onCreateList={() => setIsCreateListDialogOpen(true)}
          onCreateLabel={() => setIsCreateLabelDialogOpen(true)}
        />

        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <div className="flex-1 mr-4">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search tasks..."
                  className="max-w-md"
                />
              </div>
            </div>
            {isSearchMode && (
              <Button variant="outline" onClick={handleClearSearch} className="ml-2">
                <X className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            )}
          </div>

          {/* Quick Add Bar */}
          {selectedListId && !isSearchMode && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Input
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                placeholder="Quick add task... (e.g., 'Call mom tomorrow at 3pm')"
                className="flex-1 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 placeholder:text-muted-foreground/60"
              />
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={!quickAddInput.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {isSearchMode ? 'Search Results' :
               selectedListId ? lists.find(l => l.id === selectedListId)?.name :
               selectedViewId ? sidebarViews.find(v => v.id === selectedViewId)?.name :
               selectedLabelId ? labels.find(l => l.id === selectedLabelId)?.name :
               'Select a list, view, or label'}
            </h1>
            {selectedListId && !isSearchMode && (
              <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {isLoadingTasks ? (
              <TaskListSkeleton count={5} />
            ) : (
              <>
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleSubtask={handleToggleSubtask}
                    onEdit={(taskId) => {
                      const task = tasks.find(t => t.id === taskId)
                      setEditingTask(task)
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
                {tasks.length === 0 && (selectedListId || selectedViewId || selectedLabelId || isSearchMode) && (
                  <p className="text-muted-foreground text-center py-8">
                    {isSearchMode ? 'No tasks match your search.' : 'No tasks found.'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
          <ListForm
            isOpen={isCreateListDialogOpen}
            onClose={() => setIsCreateListDialogOpen(false)}
            onSubmit={handleCreateList}
          />
        </Dialog>

        <Dialog open={!!editingList} onOpenChange={() => setEditingList(undefined)}>
          <ListForm
            list={editingList}
            isOpen={!!editingList}
            onClose={() => setEditingList(undefined)}
            onSubmit={handleEditList}
          />
        </Dialog>

        <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
          <TaskForm
            isOpen={isCreateTaskDialogOpen}
            onClose={() => setIsCreateTaskDialogOpen(false)}
            onSubmit={handleCreateTask}
            existingTasks={tasks}
          />
        </Dialog>

        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(undefined)}>
          <TaskForm
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(undefined)}
            onSubmit={handleEditTask}
            existingTasks={tasks}
          />
        </Dialog>

        <Dialog open={isCreateLabelDialogOpen} onOpenChange={setIsCreateLabelDialogOpen}>
          <LabelForm
            isOpen={isCreateLabelDialogOpen}
            onClose={() => setIsCreateLabelDialogOpen(false)}
            onSubmit={handleCreateLabel}
          />
        </Dialog>

        <Dialog open={!!editingLabel} onOpenChange={() => setEditingLabel(undefined)}>
          <LabelForm
            label={editingLabel}
            isOpen={!!editingLabel}
            onClose={() => setEditingLabel(undefined)}
            onSubmit={handleEditLabel}
          />
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}