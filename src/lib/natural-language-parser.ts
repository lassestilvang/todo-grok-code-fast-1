import { addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, endOfDay, parse, isValid } from "date-fns"

export interface ParsedTaskData {
  title: string
  description?: string
  dueDate?: Date
  deadline?: Date
  priority?: "low" | "medium" | "high" | "urgent"
  labels?: string[]
}

// Time keywords and their hour mappings
const TIME_KEYWORDS: Record<string, number> = {
  'morning': 9,
  'afternoon': 14,
  'evening': 18,
  'night': 20,
  'midnight': 0,
  'noon': 12,
}

// Date keywords and their date calculations
const DATE_KEYWORDS: Record<string, (now: Date) => Date> = {
  'today': (now) => startOfDay(now),
  'tomorrow': (now) => startOfDay(addDays(now, 1)),
  'yesterday': (now) => startOfDay(addDays(now, -1)),
  'next week': (now) => startOfDay(addWeeks(now, 1)),
  'next month': (now) => startOfDay(addMonths(now, 1)),
  'end of week': (now) => endOfDay(addDays(now, 6 - now.getDay())),
  'end of month': (now) => endOfDay(addMonths(now, 1)),
}

// Priority keywords
const PRIORITY_KEYWORDS: Record<string, "low" | "medium" | "high" | "urgent"> = {
  'low': 'low',
  'medium': 'medium',
  'high': 'high',
  'urgent': 'urgent',
  'important': 'high',
  'critical': 'urgent',
  'asap': 'urgent',
}

// Common label keywords
const LABEL_KEYWORDS = [
  'work', 'personal', 'urgent', 'meeting', 'call', 'email', 'shopping',
  'health', 'finance', 'home', 'family', 'friends', 'travel', 'project'
]

export function parseNaturalLanguage(input: string): ParsedTaskData {
  const now = new Date()
  const lowerInput = input.toLowerCase()

  // Extract time patterns (e.g., "at 1 PM", "1:30 PM", "3pm")
  const timeRegex = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/g
  const timeMatches = [...input.matchAll(timeRegex)]

  // Extract date patterns
  const datePatterns = [
    // "tomorrow at 3pm"
    /(tomorrow|yesterday|today)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i,
    // "next week"
    /(next\s+(week|month))/i,
    // "end of week/month"
    /(end\s+of\s+(week|month))/i,
    // Specific dates like "Jan 15", "15th Jan", "2024-01-15"
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4}?)/i,
    /(\d{4}-\d{2}-\d{2})/,
  ]

  let parsedDate: Date | undefined
  let parsedTime: { hour: number; minute: number } | undefined

  // Check for date keywords first
  for (const [keyword, dateFn] of Object.entries(DATE_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      parsedDate = dateFn(now)
      break
    }
  }

  // Parse time from matches
  if (timeMatches.length > 0) {
    const match = timeMatches[0] // Take the first time match
    const hour = parseInt(match[1])
    const minute = match[2] ? parseInt(match[2]) : 0
    const ampm = match[3]?.toLowerCase()

    let adjustedHour = hour
    if (ampm === 'pm' && hour !== 12) adjustedHour += 12
    if (ampm === 'am' && hour === 12) adjustedHour = 0

    parsedTime = { hour: adjustedHour, minute }
  }

  // Check for time keywords if no specific time found
  if (!parsedTime) {
    for (const [keyword, hour] of Object.entries(TIME_KEYWORDS)) {
      if (lowerInput.includes(keyword)) {
        parsedTime = { hour, minute: 0 }
        break
      }
    }
  }

  // Combine date and time
  let finalDate: Date | undefined
  if (parsedDate) {
    finalDate = new Date(parsedDate)
    if (parsedTime) {
      finalDate = setHours(setMinutes(finalDate, parsedTime.minute), parsedTime.hour)
    }
  } else if (parsedTime) {
    // If only time is specified, assume today
    finalDate = setHours(setMinutes(now, parsedTime.minute), parsedTime.hour)
  }

  // Extract priority
  let priority: "low" | "medium" | "high" | "urgent" | undefined
  for (const [keyword, pri] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      priority = pri
      break
    }
  }

  // Extract labels
  const labels: string[] = []
  for (const label of LABEL_KEYWORDS) {
    if (lowerInput.includes(label)) {
      labels.push(label)
    }
  }

  // Extract title by removing parsed elements
  let title = input

  // Remove time patterns
  title = title.replace(timeRegex, '').trim()

  // Remove date keywords
  for (const keyword of Object.keys(DATE_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    title = title.replace(regex, '').trim()
  }

  // Remove priority keywords
  for (const keyword of Object.keys(PRIORITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    title = title.replace(regex, '').trim()
  }

  // Remove label keywords
  for (const label of LABEL_KEYWORDS) {
    const regex = new RegExp(`\\b${label}\\b`, 'gi')
    title = title.replace(regex, '').trim()
  }

  // Remove common connecting words
  title = title.replace(/\b(at|on|in|for|with|by|due|deadline|priority|label)\b/gi, '').trim()

  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim()

  // If title is empty, use a default
  if (!title) {
    title = "New Task"
  }

  return {
    title,
    dueDate: finalDate,
    priority: priority || "medium",
    labels: labels.length > 0 ? labels : undefined,
  }
}

// Helper function to parse specific date formats
function parseSpecificDate(dateStr: string, now: Date): Date | undefined {
  // Try parsing various formats
  const formats = [
    'MMM d',
    'MMMM d',
    'd MMM',
    'd MMMM',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
  ]

  for (const format of formats) {
    const parsed = parse(dateStr, format, now)
    if (isValid(parsed)) {
      return parsed
    }
  }

  return undefined
}