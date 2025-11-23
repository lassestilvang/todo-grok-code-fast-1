import { addHours, addMinutes, isWithinInterval, areIntervalsOverlapping, startOfDay, endOfDay, setHours, setMinutes, format } from "date-fns"

export interface TaskTimeSlot {
  start: Date
  end: Date
  title: string
  priority: "low" | "medium" | "high" | "urgent"
}

export interface SchedulingSuggestion {
  suggestedTime: Date
  reason: string
  confidence: "high" | "medium" | "low"
}

export interface SchedulingOptions {
  preferredDate?: Date
  duration?: number // in minutes
  priority?: "low" | "medium" | "high" | "urgent"
  avoidConflicts?: boolean
}

// Working hours (9 AM to 6 PM by default)
const DEFAULT_WORKING_HOURS = {
  start: 9,
  end: 18,
}

// Break duration between tasks (15 minutes)
const BREAK_DURATION_MINUTES = 15

export function getSmartSchedulingSuggestions(
  existingTasks: TaskTimeSlot[],
  options: SchedulingOptions = {}
): SchedulingSuggestion[] {
  const {
    preferredDate,
    duration = 60, // 1 hour default
    priority = "medium",
    avoidConflicts = true
  } = options

  const suggestions: SchedulingSuggestion[] = []
  const now = new Date()

  // If no preferred date, suggest for today or tomorrow
  const targetDate = preferredDate || (now.getHours() < 18 ? now : addHours(startOfDay(addHours(now, 24)), 9))

  // Get existing tasks for the target date
  const tasksOnDate = existingTasks.filter(task =>
    task.start.toDateString() === targetDate.toDateString()
  )

  // Sort tasks by start time
  tasksOnDate.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Find free slots
  const freeSlots = findFreeTimeSlots(targetDate, tasksOnDate, duration)

  // Generate suggestions
  for (const slot of freeSlots.slice(0, 5)) { // Limit to top 5 suggestions
    const suggestion: SchedulingSuggestion = {
      suggestedTime: slot.start,
      reason: generateSuggestionReason(slot, tasksOnDate, priority),
      confidence: calculateConfidence(slot, tasksOnDate, priority)
    }
    suggestions.push(suggestion)
  }

  // If no free slots found, suggest next day
  if (suggestions.length === 0) {
    const nextDay = addHours(startOfDay(addHours(targetDate, 24)), 9)
    suggestions.push({
      suggestedTime: nextDay,
      reason: "No available slots today. Suggested for tomorrow morning.",
      confidence: "medium"
    })
  }

  return suggestions
}

function findFreeTimeSlots(targetDate: Date, existingTasks: TaskTimeSlot[], durationMinutes: number): { start: Date, end: Date }[] {
  const slots: { start: Date, end: Date }[] = []
  const workingStart = setHours(setMinutes(targetDate, 0), DEFAULT_WORKING_HOURS.start)
  const workingEnd = setHours(setMinutes(targetDate, 0), DEFAULT_WORKING_HOURS.end)

  // Start from working hours begin
  let currentTime = workingStart

  for (const task of existingTasks) {
    // If there's a gap before this task
    if (currentTime < task.start) {
      const gapDuration = (task.start.getTime() - currentTime.getTime()) / (1000 * 60) // in minutes
      if (gapDuration >= durationMinutes + BREAK_DURATION_MINUTES) {
        // We can fit the task plus a break
        const slotEnd = addMinutes(currentTime, durationMinutes)
        if (slotEnd <= task.start) {
          slots.push({
            start: currentTime,
            end: slotEnd
          })
        }
      }
    }

    // Move current time to after this task plus break
    currentTime = addMinutes(task.end, BREAK_DURATION_MINUTES)
  }

  // Check remaining time after last task
  if (currentTime < workingEnd) {
    const remainingDuration = (workingEnd.getTime() - currentTime.getTime()) / (1000 * 60)
    if (remainingDuration >= durationMinutes) {
      const slotEnd = addMinutes(currentTime, durationMinutes)
      if (slotEnd <= workingEnd) {
        slots.push({
          start: currentTime,
          end: slotEnd
        })
      }
    }
  }

  return slots
}

function generateSuggestionReason(slot: { start: Date, end: Date }, existingTasks: TaskTimeSlot[], priority: string): string {
  const timeStr = format(slot.start, 'h:mm a')

  // Check if it's during optimal hours
  const hour = slot.start.getHours()
  if (hour >= 9 && hour <= 11) {
    return `Great morning slot at ${timeStr} - high productivity time`
  } else if (hour >= 14 && hour <= 16) {
    return `Good afternoon slot at ${timeStr} - focused work time`
  } else if (hour >= 11 && hour <= 13) {
    return `Lunch hour slot at ${timeStr} - good for meetings`
  }

  // Check proximity to existing tasks
  const nearbyTasks = existingTasks.filter(task =>
    Math.abs(task.start.getTime() - slot.start.getTime()) < 2 * 60 * 60 * 1000 // within 2 hours
  )

  if (nearbyTasks.length === 0) {
    return `Free slot at ${timeStr} - no nearby tasks`
  } else {
    return `Available slot at ${timeStr} - fits well with your schedule`
  }
}

function calculateConfidence(slot: { start: Date, end: Date }, existingTasks: TaskTimeSlot[], priority: string): "high" | "medium" | "low" {
  const hour = slot.start.getHours()

  // High confidence for prime working hours
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
    return "high"
  }

  // Medium confidence for other working hours
  if (hour >= DEFAULT_WORKING_HOURS.start && hour <= DEFAULT_WORKING_HOURS.end) {
    return "medium"
  }

  // Low confidence for outside working hours
  return "low"
}

export function checkForConflicts(proposedTime: Date, durationMinutes: number, existingTasks: TaskTimeSlot[]): boolean {
  const proposedEnd = addMinutes(proposedTime, durationMinutes)
  const proposedInterval = { start: proposedTime, end: proposedEnd }

  return existingTasks.some(task => {
    const taskInterval = { start: task.start, end: task.end }
    return areIntervalsOverlapping(proposedInterval, taskInterval)
  })
}

export function getNextAvailableSlot(
  startTime: Date,
  durationMinutes: number,
  existingTasks: TaskTimeSlot[]
): Date | null {
  let currentTime = startTime

  // Try for the next 24 hours
  for (let i = 0; i < 24 * 4; i++) { // Check every 15 minutes
    if (!checkForConflicts(currentTime, durationMinutes, existingTasks)) {
      return currentTime
    }
    currentTime = addMinutes(currentTime, 15)
  }

  return null
}