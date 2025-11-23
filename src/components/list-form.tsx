"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { List } from "./list-item"

export interface ListFormData {
  name: string
  color: string
  emoji?: string
}

export interface ListFormProps {
  list?: List
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ListFormData) => void
}

const colorOptions = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
]

const emojiOptions = ["📝", "✅", "🚀", "💡", "🎯", "📊", "🏠", "💼", "🎨", "📚"]

export function ListForm({ list, isOpen, onClose, onSubmit }: ListFormProps) {
  const [formData, setFormData] = useState<ListFormData>(() => ({
    name: list?.name || "",
    color: list?.color || colorOptions[0],
    emoji: list?.emoji,
  }))

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation rules
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long"
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters long"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset form when dialog opens/closes or list changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: list?.name || "",
        color: list?.color || colorOptions[0],
        emoji: list?.emoji,
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, list])

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{list ? "Edit List" : "Create New List"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter list name"
              className={errors.name ? "border-destructive focus:ring-destructive" : ""}
              required
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 transition-transform",
                    formData.color === color && "border-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label>Emoji (optional)</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "w-8 h-8 rounded border-2 flex items-center justify-center text-lg hover:scale-110 transition-transform",
                  !formData.emoji && "border-primary bg-primary/10"
                )}
                onClick={() => setFormData(prev => ({ ...prev, emoji: undefined }))}
              >
                ✕
              </button>
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded border-2 flex items-center justify-center text-lg hover:scale-110 transition-transform",
                    formData.emoji === emoji && "border-primary bg-primary/10"
                  )}
                  onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              {formData.emoji && <span className="text-lg">{formData.emoji}</span>}
              <span className="text-sm font-medium">{formData.name || "List Name"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (list ? "Update List" : "Create List")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}