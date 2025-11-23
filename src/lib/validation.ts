/**
 * Validates a task title
 */
export const validateTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title is required and must be a string' }
  }

  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Title cannot be empty' }
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Title must be at least 2 characters long' }
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: 'Title must be less than 200 characters long' }
  }

  return { isValid: true }
}

/**
 * Validates a name (for lists, labels, etc.)
 */
export const validateName = (
  name: string,
  options: { minLength?: number; maxLength?: number; fieldName?: string } = {}
): { isValid: boolean; error?: string } => {
  const { minLength = 2, maxLength = 50, fieldName = 'Name' } = options

  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} is required and must be a string` }
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` }
  }

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` }
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters long` }
  }

  return { isValid: true }
}

/**
 * Validates a hex color code
 */
export const validateHexColor = (color: string): { isValid: boolean; error?: string } => {
  if (!color) return { isValid: true } // Optional field

  if (typeof color !== 'string') {
    return { isValid: false, error: 'Color must be a string' }
  }

  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    return { isValid: false, error: 'Color must be a valid hex color code (e.g., #FF0000)' }
  }

  return { isValid: true }
}

/**
 * Validates a priority value
 */
export const validatePriority = (priority: string): { isValid: boolean; error?: string } => {
  if (!priority) return { isValid: true } // Optional field

  const validPriorities = ['low', 'medium', 'high', 'urgent']
  if (!validPriorities.includes(priority.toLowerCase())) {
    return { isValid: false, error: 'Priority must be one of: low, medium, high, urgent' }
  }

  return { isValid: true }
}

/**
 * Validates a positive number (for estimates, etc.)
 */
export const validatePositiveNumber = (
  value: number | undefined,
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } => {
  if (value === undefined || value === null) return { isValid: true } // Optional field

  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a number` }
  }

  if (value < 0) {
    return { isValid: false, error: `${fieldName} must be a positive number` }
  }

  return { isValid: true }
}

/**
 * Validates recurring task settings
 */
export const validateRecurring = (recurring: any): { isValid: boolean; error?: string } => {
  if (!recurring || !recurring.enabled) return { isValid: true }

  const validFrequencies = ['daily', 'weekly', 'monthly']
  if (!validFrequencies.includes(recurring.frequency)) {
    return { isValid: false, error: 'Recurring frequency must be daily, weekly, or monthly' }
  }

  if (!recurring.interval || recurring.interval < 1) {
    return { isValid: false, error: 'Recurring interval must be at least 1' }
  }

  return { isValid: true }
}

/**
 * Validates date string format
 */
export const validateDateString = (dateString: string, fieldName: string = 'Date'): { isValid: boolean; error?: string } => {
  if (!dateString) return { isValid: true } // Optional field

  if (typeof dateString !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` }
  }

  if (isNaN(Date.parse(dateString))) {
    return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` }
  }

  return { isValid: true }
}

/**
 * Validates that due date is before deadline
 */
export const validateDateOrder = (
  dueDate?: string,
  deadline?: string
): { isValid: boolean; error?: string } => {
  if (!dueDate || !deadline) return { isValid: true }

  const due = new Date(dueDate)
  const dead = new Date(deadline)

  if (due >= dead) {
    return { isValid: false, error: 'Deadline cannot be before or equal to due date' }
  }

  return { isValid: true }
}