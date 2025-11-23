import {
  validateTitle,
  validateName,
  validateHexColor,
  validatePriority,
  validatePositiveNumber,
  validateRecurring,
  validateDateString,
  validateDateOrder,
} from '../validation'

describe('validation', () => {
  describe('validateTitle', () => {
    it('validates a correct title', () => {
      const result = validateTitle('Valid Task Title')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects empty title', () => {
      const result = validateTitle('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })

    it('rejects title that is too short', () => {
      const result = validateTitle('A')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 2 characters')
    })

    it('rejects title that is too long', () => {
      const longTitle = 'a'.repeat(201)
      const result = validateTitle(longTitle)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('less than 200 characters')
    })

    it('rejects non-string title', () => {
      const result = validateTitle(123 as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be a string')
    })
  })

  describe('validateName', () => {
    it('validates a correct name', () => {
      const result = validateName('Valid Name')
      expect(result.isValid).toBe(true)
    })

    it('uses custom field name', () => {
      const result = validateName('', { fieldName: 'Label' })
      expect(result.error).toContain('Label')
    })

    it('respects custom min/max lengths', () => {
      const result = validateName('A', { minLength: 3, maxLength: 10 })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 3 characters')
    })
  })

  describe('validateHexColor', () => {
    it('accepts valid hex color', () => {
      const result = validateHexColor('#FF0000')
      expect(result.isValid).toBe(true)
    })

    it('accepts lowercase hex color', () => {
      const result = validateHexColor('#ff0000')
      expect(result.isValid).toBe(true)
    })

    it('rejects invalid hex color', () => {
      const result = validateHexColor('#GGG')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('valid hex color')
    })

    it('rejects hex color without #', () => {
      const result = validateHexColor('FF0000')
      expect(result.isValid).toBe(false)
    })

    it('rejects short hex color', () => {
      const result = validateHexColor('#FFF')
      expect(result.isValid).toBe(false)
    })

    it('accepts empty/undefined color', () => {
      expect(validateHexColor('').isValid).toBe(true)
      expect(validateHexColor(undefined as any).isValid).toBe(true)
    })
  })

  describe('validatePriority', () => {
    it('accepts valid priorities', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      validPriorities.forEach(priority => {
        const result = validatePriority(priority)
        expect(result.isValid).toBe(true)
      })
    })

    it('accepts case insensitive priorities', () => {
      const result = validatePriority('LOW')
      expect(result.isValid).toBe(true)
    })

    it('rejects invalid priority', () => {
      const result = validatePriority('invalid')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be one of')
    })

    it('accepts empty priority', () => {
      const result = validatePriority('')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validatePositiveNumber', () => {
    it('accepts positive numbers', () => {
      const result = validatePositiveNumber(5, 'Estimate')
      expect(result.isValid).toBe(true)
    })

    it('accepts zero', () => {
      const result = validatePositiveNumber(0)
      expect(result.isValid).toBe(true)
    })

    it('rejects negative numbers', () => {
      const result = validatePositiveNumber(-1, 'Time')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('positive number')
    })

    it('rejects non-numbers', () => {
      const result = validatePositiveNumber('5' as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be a number')
    })

    it('accepts undefined/null', () => {
      expect(validatePositiveNumber(undefined).isValid).toBe(true)
      expect(validatePositiveNumber(null as any).isValid).toBe(true)
    })
  })

  describe('validateRecurring', () => {
    it('accepts valid recurring settings', () => {
      const result = validateRecurring({
        enabled: true,
        frequency: 'weekly',
        interval: 2,
      })
      expect(result.isValid).toBe(true)
    })

    it('accepts disabled recurring', () => {
      const result = validateRecurring({ enabled: false })
      expect(result.isValid).toBe(true)
    })

    it('rejects invalid frequency', () => {
      const result = validateRecurring({
        enabled: true,
        frequency: 'invalid',
        interval: 1,
      })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('frequency must be')
    })

    it('rejects invalid interval', () => {
      const result = validateRecurring({
        enabled: true,
        frequency: 'daily',
        interval: 0,
      })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('interval must be at least 1')
    })

    it('accepts null/undefined recurring', () => {
      expect(validateRecurring(null).isValid).toBe(true)
      expect(validateRecurring(undefined).isValid).toBe(true)
    })
  })

  describe('validateDateString', () => {
    it('accepts valid date string', () => {
      const result = validateDateString('2024-12-25')
      expect(result.isValid).toBe(true)
    })

    it('rejects invalid date string', () => {
      const result = validateDateString('invalid-date')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid date format')
    })

    it('rejects non-string date', () => {
      const result = validateDateString(123 as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be a string')
    })

    it('accepts empty date string', () => {
      const result = validateDateString('')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateDateOrder', () => {
    it('accepts due date before deadline', () => {
      const result = validateDateOrder('2024-12-25', '2024-12-26')
      expect(result.isValid).toBe(true)
    })

    it('rejects deadline before due date', () => {
      const result = validateDateOrder('2024-12-26', '2024-12-25')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be before')
    })

    it('rejects same date for due and deadline', () => {
      const result = validateDateOrder('2024-12-25', '2024-12-25')
      expect(result.isValid).toBe(false)
    })

    it('accepts missing dates', () => {
      expect(validateDateOrder('2024-12-25').isValid).toBe(true)
      expect(validateDateOrder(undefined, '2024-12-25').isValid).toBe(true)
      expect(validateDateOrder().isValid).toBe(true)
    })
  })
})