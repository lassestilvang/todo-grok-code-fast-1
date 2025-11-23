import {
  formatDate,
  formatDateShort,
  isOverdue,
  getTodayRange,
  getNext7DaysRange,
  startOfDay,
} from '../date-utils'

describe('date-utils', () => {
  describe('formatDate', () => {
    it('formats a valid date correctly', () => {
      const date = new Date('2024-12-25')
      const result = formatDate(date)
      expect(result).toBe('December 25th, 2024')
    })

    it('returns null for invalid date', () => {
      const result = formatDate(new Date('invalid'))
      expect(result).toBeNull()
    })

    it('returns null for null/undefined', () => {
      expect(formatDate(null)).toBeNull()
      expect(formatDate(undefined)).toBeNull()
    })
  })

  describe('formatDateShort', () => {
    it('formats a valid date in short format', () => {
      const date = new Date('2024-12-25')
      const result = formatDateShort(date)
      expect(result).toBe('12/25/2024')
    })

    it('returns null for invalid date', () => {
      const result = formatDateShort(new Date('invalid'))
      expect(result).toBeNull()
    })
  })

  describe('isOverdue', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-12-15'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns true for past due date when not completed', () => {
      const pastDate = new Date('2024-12-10')
      expect(isOverdue(pastDate, false)).toBe(true)
    })

    it('returns false for future due date', () => {
      const futureDate = new Date('2024-12-20')
      expect(isOverdue(futureDate, false)).toBe(false)
    })

    it('returns false for past due date when completed', () => {
      const pastDate = new Date('2024-12-10')
      expect(isOverdue(pastDate, true)).toBe(false)
    })

    it('returns false for null/undefined due date', () => {
      expect(isOverdue(null, false)).toBe(false)
      expect(isOverdue(undefined, false)).toBe(false)
    })

    it('returns false for invalid due date', () => {
      expect(isOverdue(new Date('invalid'), false)).toBe(false)
    })
  })

  describe('getTodayRange', () => {
    it('returns correct start and end dates for today', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-12-15T10:30:00'))

      const { start, end } = getTodayRange()

      expect(start.toISOString()).toBe('2024-12-15T00:00:00.000Z')
      expect(end.toISOString()).toBe('2024-12-16T00:00:00.000Z')

      jest.useRealTimers()
    })
  })

  describe('getNext7DaysRange', () => {
    it('returns correct date range for next 7 days', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-12-15T10:30:00'))

      const { start, end } = getNext7DaysRange()

      expect(start.toISOString()).toBe('2024-12-15T00:00:00.000Z')
      expect(end.toISOString()).toBe('2024-12-22T00:00:00.000Z')

      jest.useRealTimers()
    })
  })

  describe('startOfDay', () => {
    it('returns the start of day for a given date', () => {
      const date = new Date('2024-12-15T15:30:45.123')
      const result = startOfDay(date)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(11) // December (0-indexed)
      expect(result.getDate()).toBe(15)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })
  })
})