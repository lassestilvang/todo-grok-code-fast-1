"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Flag, Paperclip, Repeat, AlertCircle, MessageSquare, FormInput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/date-picker"
import { cn } from "@/lib/utils"
import { parseNaturalLanguage } from "@/lib/natural-language-parser"
import { getSmartSchedulingSuggestions, type TaskTimeSlot, type SchedulingSuggestion } from "@/lib/smart-scheduling"
import type { Task, Subtask, Priority } from "./task-item"

export interface TaskFormData {
  title: string
  description: string
  priority: Priority
  dueDate?: Date
  deadline?: Date
  reminders: Date[]
  estimate?: number
  actual?: number
  labels: string[]
  subtasks: Omit<Subtask, "id">[]
  recurring: {
    enabled: boolean
    frequency: "daily" | "weekly" | "monthly"
    interval: number
  }
  attachments: File[]
}

export interface TaskFormProps {
  task?: Task
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => void
  existingTasks?: Task[]
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-blue-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
]

export function TaskForm({ task, isOpen, onClose, onSubmit, existingTasks = [] }: TaskFormProps) {
  const [isNaturalLanguageMode, setIsNaturalLanguageMode] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [schedulingSuggestions, setSchedulingSuggestions] = useState<SchedulingSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [formData, setFormData] = useState<TaskFormData>(() => ({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate,
    deadline: task?.deadline,
    reminders: [],
    estimate: task?.estimate,
    actual: task?.actual,
    labels: task?.labels || [],
    subtasks: task?.subtasks.map(st => ({ title: st.title, completed: st.completed })) || [],
    recurring: {
      enabled: false,
      frequency: "weekly",
      interval: 1,
    },
    attachments: [],
  }))

  const [newLabel, setNewLabel] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation rules
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters long"
    }

    // Date validation
    if (formData.dueDate && formData.deadline) {
      if (formData.dueDate > formData.deadline) {
        newErrors.deadline = "Deadline cannot be before due date"
      }
    }

    // Time estimates validation
    if (formData.estimate !== undefined && formData.estimate < 0) {
      newErrors.estimate = "Estimate must be a positive number"
    }

    if (formData.actual !== undefined && formData.actual < 0) {
      newErrors.actual = "Actual time must be a positive number"
    }

    // Recurring validation
    if (formData.recurring.enabled) {
      if (formData.recurring.interval < 1) {
        newErrors.recurringInterval = "Interval must be at least 1"
      }
    }

    // Subtasks validation
    formData.subtasks.forEach((subtask, index) => {
      if (!subtask.title.trim()) {
        newErrors[`subtask-${index}`] = "Subtask title cannot be empty"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate,
        deadline: task?.deadline,
        reminders: [],
        estimate: task?.estimate,
        actual: task?.actual,
        labels: task?.labels || [],
        subtasks: task?.subtasks.map(st => ({ title: st.title, completed: st.completed })) || [],
        recurring: {
          enabled: false,
          frequency: "weekly",
          interval: 1,
        },
        attachments: [],
      })
      setNaturalLanguageInput("")
      setIsNaturalLanguageMode(false)
      setSchedulingSuggestions([])
      setShowSuggestions(false)
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, task])

  const handleNaturalLanguageParse = () => {
    if (!naturalLanguageInput.trim()) return

    const parsed = parseNaturalLanguage(naturalLanguageInput)
    setFormData(prev => ({
      ...prev,
      title: parsed.title,
      description: parsed.description || prev.description,
      dueDate: parsed.dueDate || prev.dueDate,
      priority: parsed.priority || prev.priority,
      labels: parsed.labels || prev.labels,
    }))
    setIsNaturalLanguageMode(false)
  }

  const generateSchedulingSuggestions = (date: Date | undefined) => {
    if (!date || existingTasks.length === 0) {
      setSchedulingSuggestions([])
      return
    }

    // Convert existing tasks to TaskTimeSlot format
    const taskSlots: TaskTimeSlot[] = existingTasks
      .filter(task => task.dueDate)
      .map(task => ({
        start: task.dueDate!,
        end: task.dueDate!, // For simplicity, assume tasks are point-in-time
        title: task.title,
        priority: task.priority
      }))

    const suggestions = getSmartSchedulingSuggestions(taskSlots, {
      preferredDate: date,
      priority: formData.priority,
    })

    setSchedulingSuggestions(suggestions)
  }

  const handleDueDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dueDate: date }))
    generateSchedulingSuggestions(date)
    setShowSuggestions(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }))
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }))
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }]
      }))
      setNewSubtask("")
    }
  }

  const removeSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }))
  }

  const updateSubtask = (index: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((st, i) =>
        i === index ? { ...st, title } : st
      )
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Natural Language Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              <span className="text-sm font-medium">Form Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Natural Language</span>
              <Switch
                checked={isNaturalLanguageMode}
                onCheckedChange={setIsNaturalLanguageMode}
              />
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>

          {isNaturalLanguageMode ? (
            /* Natural Language Input */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="natural-language">Describe your task in natural language</Label>
                <Textarea
                  id="natural-language"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="e.g., Lunch with Sarah at 1 PM tomorrow, high priority"
                  rows={3}
                />
              </div>
              <Button
                type="button"
                onClick={handleNaturalLanguageParse}
                disabled={!naturalLanguageInput.trim()}
                className="w-full"
              >
                Parse Task Details
              </Button>
              <div className="text-xs text-muted-foreground">
                Try: "Meeting with John at 3 PM next Tuesday, urgent work priority"
              </div>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className={errors.title ? "border-destructive focus:ring-destructive" : ""}
                  required
                />
                {errors.title && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </div>
                )}
              </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Priority and Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) =>
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker
                date={formData.dueDate}
                onDateChange={handleDueDateChange}
                placeholder="Select due date"
              />

              {/* Smart Scheduling Suggestions */}
              {showSuggestions && schedulingSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Smart Suggestions</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {schedulingSuggestions.slice(0, 3).map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent/50"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, dueDate: suggestion.suggestedTime }))
                          setShowSuggestions(false)
                        }}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {suggestion.suggestedTime.toLocaleDateString()} at {suggestion.suggestedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {suggestion.reason}
                          </div>
                        </div>
                        <div className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          suggestion.confidence === "high" && "bg-green-100 text-green-800",
                          suggestion.confidence === "medium" && "bg-yellow-100 text-yellow-800",
                          suggestion.confidence === "low" && "bg-red-100 text-red-800"
                        )}>
                          {suggestion.confidence}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Deadline and Time Estimates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Deadline</Label>
              <DatePicker
                date={formData.deadline}
                onDateChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                placeholder="Select deadline"
                error={!!errors.deadline}
              />
              {errors.deadline && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.deadline}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimate || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  estimate: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                placeholder="0"
              />
              {errors.estimate && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.estimate}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual">Actual (hours)</Label>
              <Input
                id="actual"
                type="number"
                min="0"
                step="0.5"
                value={formData.actual || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  actual: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                placeholder="0"
              />
              {errors.actual && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.actual}
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.labels.map((label) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {label}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLabel(label)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
              />
              <Button type="button" onClick={addLabel} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label>Subtasks</Label>
            <AnimatePresence>
              {formData.subtasks.map((subtask, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        subtasks: prev.subtasks.map((st, i) =>
                          i === index ? { ...st, completed: !!checked } : st
                        )
                      }))
                    }
                  />
                  <Input
                    value={subtask.title}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                    placeholder="Subtask title"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {errors[`subtask-${index}`] && (
                    <div className="flex items-center gap-1 text-sm text-destructive ml-6">
                      <AlertCircle className="h-3 w-3" />
                      {errors[`subtask-${index}`]}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
              />
              <Button type="button" onClick={addSubtask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.recurring.enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    recurring: { ...prev.recurring, enabled: !!checked }
                  }))
                }
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recurring Task
              </Label>
            </div>

            {formData.recurring.enabled && (
              <motion.div
                className="grid grid-cols-2 gap-4 pl-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurring.frequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly") =>
                      setFormData(prev => ({
                        ...prev,
                        recurring: { ...prev.recurring, frequency: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Every</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.recurring.interval}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurring: {
                        ...prev.recurring,
                        interval: parseInt(e.target.value) || 1
                      }
                    }))}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setFormData(prev => ({
                  ...prev,
                  attachments: [...prev.attachments, ...files]
                }))
              }}
            />
            {formData.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index)
                      }))}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (task ? "Update Task" : "Create Task")}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}