import { describe, expect, it } from 'vitest'
import {
  fillMonths,
  formatRevenue,
  monthLabel,
  occupancyTier,
} from '../../../src/pages/metrics/metricsUtils'

describe('occupancyTier', () => {
  it('classifies 70% and above as high', () => {
    expect(occupancyTier(70)).toBe('high')
    expect(occupancyTier(100)).toBe('high')
  })

  it('classifies 40% up to but not including 70% as mid', () => {
    expect(occupancyTier(40)).toBe('mid')
    expect(occupancyTier(69.9)).toBe('mid')
  })

  it('classifies below 40% as low', () => {
    expect(occupancyTier(39.9)).toBe('low')
    expect(occupancyTier(0)).toBe('low')
  })
})

describe('formatRevenue', () => {
  it('renders values below 1000 without decimals', () => {
    expect(formatRevenue(850)).toBe('850')
    expect(formatRevenue(0)).toBe('0')
    expect(formatRevenue(999.4)).toBe('999')
  })

  it('rounds to the nearest unit below 1000', () => {
    expect(formatRevenue(999.6)).toBe('1000')
  })

  it('renders 1000 and above in thousands with one decimal', () => {
    expect(formatRevenue(1000)).toBe('1.0k')
    expect(formatRevenue(12_345)).toBe('12.3k')
  })
})

describe('monthLabel', () => {
  it('returns a short month name for the given locale', () => {
    expect(monthLabel(1, 'en')).toMatch(/^Jan/)
    expect(monthLabel(12, 'en')).toMatch(/^Dec/)
  })

  it('is locale-aware', () => {
    expect(monthLabel(1, 'es')).not.toBe(monthLabel(1, 'en'))
  })
})

describe('fillMonths', () => {
  const fallback = (month: number, year: number) => ({ year, month, value: 0 })

  it('always returns twelve entries in month order', () => {
    const result = fillMonths([], 2025, fallback)

    expect(result).toHaveLength(12)
    expect(result.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('keeps the entries present in the source', () => {
    const march = { year: 2025, month: 3, value: 42 }

    const result = fillMonths([march], 2025, fallback)

    expect(result[2]).toBe(march)
  })

  it('fills the gaps with the factory, stamped with the given year', () => {
    const result = fillMonths([{ year: 2025, month: 3, value: 42 }], 2025, fallback)

    expect(result[0]).toEqual({ year: 2025, month: 1, value: 0 })
    expect(result[11]).toEqual({ year: 2025, month: 12, value: 0 })
  })

  it('keeps only the first entry when a month is duplicated', () => {
    const first = { year: 2025, month: 5, value: 1 }
    const second = { year: 2025, month: 5, value: 2 }

    expect(fillMonths([first, second], 2025, fallback)[4]).toBe(first)
  })
})
