import { describe, expect, it } from 'vitest'
import type { Booking } from '../../src/domain/models.js'
import {
  datesOverlap,
  findOverlappingBooking,
  isValidDateRange,
  meetsMinNights,
  stripTime,
} from '../../src/domain/validators.js'

const makeBooking = (id: string, apartmentId: string, from: string, to: string): Booking => ({
  id,
  apartmentId,
  clientId: 'c1',
  channelId: 'ch1',
  fromDate: from,
  toDate: to,
  adultCount: 1,
  childrenCount: 0,
  status: 'Active',
  totalAmountDue: 100,
  createdAt: '2025-01-01T00:00:00.000Z',
})

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

describe('datesOverlap', () => {
  it('detects overlapping ranges', () => {
    expect(datesOverlap('2025-01-01', '2025-01-05', '2025-01-03', '2025-01-08')).toBe(true)
  })

  it('checkout equals next checkin is NOT an overlap', () => {
    expect(datesOverlap('2025-01-01', '2025-01-05', '2025-01-05', '2025-01-10')).toBe(false)
  })

  it('adjacent ranges with checkin equals previous checkout is NOT an overlap', () => {
    expect(datesOverlap('2025-01-05', '2025-01-10', '2025-01-01', '2025-01-05')).toBe(false)
  })

  it('B fully inside A overlaps', () => {
    expect(datesOverlap('2025-01-01', '2025-01-10', '2025-01-03', '2025-01-07')).toBe(true)
  })

  it('A fully inside B overlaps', () => {
    expect(datesOverlap('2025-01-03', '2025-01-07', '2025-01-01', '2025-01-10')).toBe(true)
  })

  it('disjoint ranges do not overlap', () => {
    expect(datesOverlap('2025-01-10', '2025-01-15', '2025-01-01', '2025-01-05')).toBe(false)
  })

  it('partial overlap from the left', () => {
    expect(datesOverlap('2025-01-03', '2025-01-08', '2025-01-01', '2025-01-05')).toBe(true)
  })
})

describe('findOverlappingBooking', () => {
  const bookings: Booking[] = [
    makeBooking('b1', 'apt1', '2025-01-01', '2025-01-05'),
    makeBooking('b2', 'apt2', '2025-01-01', '2025-01-10'),
  ]

  it('returns overlapping booking on same apartment', () => {
    const result = findOverlappingBooking(bookings, 'apt1', '2025-01-03', '2025-01-08')
    expect(result?.id).toBe('b1')
  })

  it('returns null when checkout equals existing checkin (adjacent)', () => {
    const result = findOverlappingBooking(bookings, 'apt1', '2025-01-05', '2025-01-10')
    expect(result).toBeNull()
  })

  it('returns null when checkin equals existing checkout (adjacent)', () => {
    const result = findOverlappingBooking(bookings, 'apt1', '2024-12-20', '2025-01-01')
    expect(result).toBeNull()
  })

  it('returns null for different apartment', () => {
    const result = findOverlappingBooking(bookings, 'apt3', '2025-01-01', '2025-01-10')
    expect(result).toBeNull()
  })

  it('excludes the specified booking id (self-update)', () => {
    const result = findOverlappingBooking(bookings, 'apt1', '2025-01-01', '2025-01-05', 'b1')
    expect(result).toBeNull()
  })

  it('still finds other overlapping bookings when excludeId set', () => {
    const extra = [...bookings, makeBooking('b3', 'apt1', '2025-01-03', '2025-01-08')]
    const result = findOverlappingBooking(extra, 'apt1', '2025-01-01', '2025-01-05', 'b1')
    expect(result?.id).toBe('b3')
  })
})
