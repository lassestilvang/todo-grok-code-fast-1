"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LabelFormData {
  name: string
  color: string
}

export interface Label {
  id: string
  name: string
  color: string
  taskCount: number
  createdAt: Date
}

export interface LabelFormProps {
  label?: Label
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LabelFormData) => void
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

export function LabelForm({ label, isOpen, onClose, onSubmit }: LabelFormProps) {
  const [formData, setFormData] = useState<LabelFormData>(() => ({
    name: label?.name || "",
    color: label?.color || colorOptions[0],
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
    } else if (formData.name.trim().length > 30) {
      newErrors.name = "Name must be less than 30 characters long"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset form when dialog opens/closes or label changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: label?.name || "",
        color: label?.color || colorOptions[0],
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, label])

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
          <DialogTitle>{label ? "Edit Label" : "Create New Label"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter label name"
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

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm font-medium">{formData.name || "Label Name"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (label ? "Update Label" : "Create Label")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}