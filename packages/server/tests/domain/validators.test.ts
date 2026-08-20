import { describe, expect, it } from 'vitest'
import { isValidDateRange, meetsMinNights, stripTime } from '../../src/domain/validators.js'

describe('stripTime', () => {
  it('strips time component', () => {
    expect(stripTime('2025-01-15T10:30:00.000Z')).toBe('2025-01-15')
  })

  it('is idempotent on date-only strings', () => {
    expect(stripTime('2025-01-15')).toBe('2025-01-15')
  })
})

describe('isValidDateRange', () => {
  it('returns true when toDate is after fromDate', () => {
    expect(isValidDateRange('2025-01-01', '2025-01-05')).toBe(true)
  })

  it('returns false when dates are equal', () => {
    expect(isValidDateRange('2025-01-01', '2025-01-01')).toBe(false)
  })

  it('returns false when toDate is before fromDate', () => {
    expect(isValidDateRange('2025-01-10', '2025-01-05')).toBe(false)
  })
})

describe('meetsMinNights', () => {
  it('returns true when nights equals minNights', () => {
    expect(meetsMinNights('2025-01-01', '2025-01-03', 2)).toBe(true)
  })

  it('returns true when nights exceeds minNights', () => {
    expect(meetsMinNights('2025-01-01', '2025-01-10', 2)).toBe(true)
  })

  it('returns false when nights is less than minNights', () => {
    expect(meetsMinNights('2025-01-01', '2025-01-02', 2)).toBe(false)
  })
})
