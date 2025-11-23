import { format, isValid } from 'date-fns'

/**
 * Formats a date for display with better error handling
 */
export const formatDate = (date: Date | undefined | null): string | null => {
  if (!date || !isValid(date)) return null
  try {
    return format(date, "PPP")
  } catch {
    return null
  }
}

/**
 * Formats a date for short display (MM/dd/yyyy)
 */
export const formatDateShort = (date: Date | undefined | null): string | null => {
  if (!date || !isValid(date)) return null
  try {
    return format(date, "MM/dd/yyyy")
  } catch {
    return null
  }
}

/**
 * Checks if a date is overdue (past due and not completed)
 */
export const isOverdue = (dueDate: Date | undefined | null, completed: boolean = false): boolean => {
  if (!dueDate || !isValid(dueDate) || completed) return false
  return dueDate < new Date()
}

/**
 * Gets date range for "today"
 */
export const getTodayRange = (): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

/**
 * Gets date range for "next 7 days"
 */
export const getNext7DaysRange = (): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

/**
 * Gets start of day for a given date
 */
export const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}