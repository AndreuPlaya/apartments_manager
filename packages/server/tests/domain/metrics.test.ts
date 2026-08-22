import { describe, expect, it } from 'vitest'
import type { Reservation } from '../../src/domain/models.js'
import { computeMetrics, computeOccupancy, computeRevenue } from '../../src/domain/metrics.js'

const makeReservation = (
  id: string,
  checkIn: string,
  checkOut: string,
  totalAmountDue: number,
): Reservation => ({
  id,
  listingId: 'apt1',
  guestId: 'c1',
  channelId: 'ch1',
  checkIn,
  checkOut,
  adultCount: 2,
  childrenCount: 0,
  status: 'Confirmed',
  paidDate: '2025-01-01',
  totalAmountDue,
  createdAt: '2025-01-01T00:00:00.000Z',
})

const withStatus = (r: Reservation, status: Reservation['status']): Reservation => ({
  ...r,
  status,
})

describe('computeOccupancy', () => {
  const yearRange = { start: 2025, end: 2025 }

  it('counts 7 booked nights in January with 2 listings', () => {
    const reservations = [makeReservation('b1', '2025-01-01', '2025-01-08', 0)]
    const result = computeOccupancy(reservations, yearRange, 2)
    const jan = result.find((r) => r.year === 2025 && r.month === 1)
    expect(jan?.bookedNights).toBe(7)
    expect(jan?.totalNights).toBe(31)
    // 7 / (2 * 31) * 100 ≈ 11.29
    expect(jan?.occupancyRate).toBeCloseTo(11.29, 1)
  })

  it('returns zero occupancy for empty reservations', () => {
    const result = computeOccupancy([], yearRange, 2)
    expect(result.every((r) => r.bookedNights === 0)).toBe(true)
    expect(result.every((r) => r.occupancyRate === 0)).toBe(true)
  })

  it('splits month-spanning reservation correctly', () => {
    // Jan 28 – Feb 4: Jan 28,29,30,31 = 4 nights; Feb 1,2,3 = 3 nights
    const reservations = [makeReservation('b1', '2025-01-28', '2025-02-04', 0)]
    const result = computeOccupancy(reservations, yearRange, 1)
    const jan = result.find((r) => r.month === 1)!
    const feb = result.find((r) => r.month === 2)!
    expect(jan.bookedNights).toBe(4)
    expect(feb.bookedNights).toBe(3)
  })

  it('handles zero listings without dividing by zero', () => {
    const reservations = [makeReservation('b1', '2025-01-01', '2025-01-05', 0)]
    const result = computeOccupancy(reservations, yearRange, 0)
    expect(result.every((r) => r.occupancyRate === 0)).toBe(true)
  })

  it('returns 12 entries for a single year range', () => {
    const result = computeOccupancy([], yearRange, 1)
    expect(result).toHaveLength(12)
  })
})

describe('computeRevenue', () => {
  const yearRange = { start: 2025, end: 2025 }

  it('sums two reservations in the same month', () => {
    const reservations = [
      makeReservation('b1', '2025-01-01', '2025-01-05', 500),
      makeReservation('b2', '2025-01-10', '2025-01-15', 300),
    ]
    const result = computeRevenue(reservations, yearRange)
    const jan = result.find((r) => r.month === 1)!
    expect(jan.revenue).toBe(800)
  })

  it('cumulative revenue accumulates within year', () => {
    const reservations = [
      makeReservation('b1', '2025-01-01', '2025-01-05', 100),
      makeReservation('b2', '2025-02-01', '2025-02-05', 200),
    ]
    const result = computeRevenue(reservations, yearRange)
    const feb = result.find((r) => r.month === 2)!
    expect(feb.cumulativeRevenue).toBeCloseTo(300)
  })

  it('returns zero revenue for empty reservations', () => {
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

describe('status and the numbers', () => {
  const yearRange = { start: 2025, end: 2025 }
  const stay = makeReservation('b1', '2025-01-01', '2025-01-08', 700)

  it('excludes a cancelled stay from occupancy', () => {
    const result = computeOccupancy([withStatus(stay, 'Cancelled')], yearRange, 1)

    expect(result.find((r) => r.month === 1)!.bookedNights).toBe(0)
  })

  it('excludes a cancelled stay from revenue', () => {
    const result = computeRevenue([withStatus(stay, 'Cancelled')], yearRange)

    expect(result.find((r) => r.month === 1)!.revenue).toBe(0)
  })

  it('excludes a no-show from occupancy — nobody was there', () => {
    const result = computeOccupancy([withStatus(stay, 'NoShow')], yearRange, 1)

    expect(result.find((r) => r.month === 1)!.bookedNights).toBe(0)
  })

  it('counts a no-show in revenue — the money is still owed', () => {
    const result = computeRevenue([withStatus(stay, 'NoShow')], yearRange)

    expect(result.find((r) => r.month === 1)!.revenue).toBe(700)
  })

  it('counts checked-in and checked-out stays in both', () => {
    for (const status of ['CheckedIn', 'CheckedOut'] as const) {
      const occ = computeOccupancy([withStatus(stay, status)], yearRange, 1)
      const rev = computeRevenue([withStatus(stay, status)], yearRange)

      expect(occ.find((r) => r.month === 1)!.bookedNights).toBe(7)
      expect(rev.find((r) => r.month === 1)!.revenue).toBe(700)
    }
  })
})

describe('revenue spread across nights', () => {
  const yearRange = { start: 2025, end: 2025 }

  it('splits a month-spanning stay in proportion to its nights', () => {
    // Jan 28 – Feb 4 is 7 nights, 4 of them in January: 700 -> 400 / 300.
    const result = computeRevenue([makeReservation('b1', '2025-01-28', '2025-02-04', 700)], yearRange)

    expect(result.find((r) => r.month === 1)!.revenue).toBe(400)
    expect(result.find((r) => r.month === 2)!.revenue).toBe(300)
  })

  it('keeps the total intact across the split', () => {
    const result = computeRevenue([makeReservation('b1', '2025-01-28', '2025-02-04', 700)], yearRange)
    const total = result.reduce((sum, r) => sum + r.revenue, 0)

    expect(total).toBeCloseTo(700, 2)
  })

  it('ignores a zero-night stay rather than dividing by zero', () => {
    const result = computeRevenue([makeReservation('b1', '2025-01-05', '2025-01-05', 500)], yearRange)

    expect(result.every((r) => r.revenue === 0)).toBe(true)
  })
})

describe('commission', () => {
  const yearRange = { start: 2025, end: 2025 }
  const rates = new Map([['ch1', 15]])

  it('derives commission and net from the channel rate', () => {
    const result = computeRevenue(
      [makeReservation('b1', '2025-01-01', '2025-01-05', 1000)],
      yearRange,
      rates,
    )
    const jan = result.find((r) => r.month === 1)!

    expect(jan.revenue).toBe(1000)
    expect(jan.commission).toBe(150)
    expect(jan.netRevenue).toBe(850)
  })

  it('treats an unlisted channel as commission-free', () => {
    const result = computeRevenue(
      [makeReservation('b1', '2025-01-01', '2025-01-05', 1000)],
      yearRange,
      new Map(),
    )
    const jan = result.find((r) => r.month === 1)!

    expect(jan.commission).toBe(0)
    expect(jan.netRevenue).toBe(1000)
  })

  it('splits commission across months with the revenue', () => {
    const result = computeRevenue(
      [makeReservation('b1', '2025-01-28', '2025-02-04', 700)],
      yearRange,
      rates,
    )

    expect(result.find((r) => r.month === 1)!.commission).toBe(60)
    expect(result.find((r) => r.month === 2)!.commission).toBe(45)
  })
})
