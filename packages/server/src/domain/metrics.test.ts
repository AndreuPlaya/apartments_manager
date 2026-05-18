import { describe, expect, it } from 'vitest'
import type { Booking } from './models.js'
import { computeMetrics, computeOccupancy, computeRevenue } from './metrics.js'

const makeBooking = (
  id: string,
  fromDate: string,
  toDate: string,
  totalAmountDue: number,
): Booking => ({
  id,
  apartmentId: 'apt1',
  clientId: 'c1',
  channelId: 'ch1',
  fromDate,
  toDate,
  adultCount: 2,
  childrenCount: 0,
  status: 'Paid',
  totalAmountDue,
  createdAt: '2025-01-01T00:00:00.000Z',
})

describe('computeOccupancy', () => {
  const yearRange = { start: 2025, end: 2025 }

  it('counts 7 booked nights in January with 2 apartments', () => {
    const bookings = [makeBooking('b1', '2025-01-01', '2025-01-08', 0)]
    const result = computeOccupancy(bookings, yearRange, 2)
    const jan = result.find((r) => r.year === 2025 && r.month === 1)
    expect(jan?.bookedNights).toBe(7)
    expect(jan?.totalNights).toBe(31)
    // 7 / (2 * 31) * 100 ≈ 11.29
    expect(jan?.occupancyRate).toBeCloseTo(11.29, 1)
  })

  it('returns zero occupancy for empty bookings', () => {
    const result = computeOccupancy([], yearRange, 2)
    expect(result.every((r) => r.bookedNights === 0)).toBe(true)
    expect(result.every((r) => r.occupancyRate === 0)).toBe(true)
  })

  it('splits month-spanning booking correctly', () => {
    // Jan 28 – Feb 4: Jan 28,29,30,31 = 4 nights; Feb 1,2,3 = 3 nights
    const bookings = [makeBooking('b1', '2025-01-28', '2025-02-04', 0)]
    const result = computeOccupancy(bookings, yearRange, 1)
    const jan = result.find((r) => r.month === 1)!
    const feb = result.find((r) => r.month === 2)!
    expect(jan.bookedNights).toBe(4)
    expect(feb.bookedNights).toBe(3)
  })

  it('handles zero apartments without dividing by zero', () => {
    const bookings = [makeBooking('b1', '2025-01-01', '2025-01-05', 0)]
    const result = computeOccupancy(bookings, yearRange, 0)
    expect(result.every((r) => r.occupancyRate === 0)).toBe(true)
  })

  it('returns 12 entries for a single year range', () => {
    const result = computeOccupancy([], yearRange, 1)
    expect(result).toHaveLength(12)
  })
})

describe('computeRevenue', () => {
  const yearRange = { start: 2025, end: 2025 }

  it('sums two bookings in the same month', () => {
    const bookings = [
      makeBooking('b1', '2025-01-01', '2025-01-05', 500),
      makeBooking('b2', '2025-01-10', '2025-01-15', 300),
    ]
    const result = computeRevenue(bookings, yearRange)
    const jan = result.find((r) => r.month === 1)!
    expect(jan.revenue).toBe(800)
  })

  it('cumulative revenue accumulates within year', () => {
    const bookings = [
      makeBooking('b1', '2025-01-01', '2025-01-05', 100),
      makeBooking('b2', '2025-02-01', '2025-02-05', 200),
    ]
    const result = computeRevenue(bookings, yearRange)
    const feb = result.find((r) => r.month === 2)!
    expect(feb.cumulativeRevenue).toBeCloseTo(300)
  })

  it('returns zero revenue for empty bookings', () => {
    const result = computeRevenue([], yearRange)
    expect(result.every((r) => r.revenue === 0)).toBe(true)
  })
})

describe('computeMetrics', () => {
  it('returns 36 occupancy entries for default 3-year range', () => {
    const result = computeMetrics([], 2, 2025)
    expect(result.occupancy).toHaveLength(36)
    expect(result.revenue).toHaveLength(36)
  })

  it('includes both occupancy and revenue arrays', () => {
    const result = computeMetrics([], 1, 2025)
    expect(result).toHaveProperty('occupancy')
    expect(result).toHaveProperty('revenue')
  })

  it('uses current year when referenceYear is not provided', () => {
    const result = computeMetrics([], 1)
    const currentYear = new Date().getFullYear()
    expect(result.occupancy.some((r) => r.year === currentYear)).toBe(true)
  })
})
