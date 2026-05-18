import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Apartment, Booking } from '../domain/models.js'

vi.mock('../infrastructure/data.js')
vi.mock('../domain/metrics.js')

import { loadApartments, loadBookings } from '../infrastructure/data.js'
import { computeMetrics } from '../domain/metrics.js'
import { getMetrics } from './metricsService.js'

const mockBookings: Booking[] = []
const mockApartments: Apartment[] = [
  {
    id: 'apt1', name: 'A', address: '', floor: 1, door: 'A',
    price: 100, minNights: 1, maxGuests: 2, rooms: 1, bathrooms: 1, isAvailable: true,
  },
]

beforeEach(() => {
  vi.mocked(loadBookings).mockReturnValue(mockBookings)
  vi.mocked(loadApartments).mockReturnValue(mockApartments)
  vi.mocked(computeMetrics).mockReturnValue({ occupancy: [], revenue: [] })
})

describe('getMetrics', () => {
  it('calls computeMetrics with bookings, apartment count, and current year', () => {
    const year = new Date().getFullYear()
    const result = getMetrics()
    expect(computeMetrics).toHaveBeenCalledWith(mockBookings, 1, year)
    expect(result).toEqual({ occupancy: [], revenue: [] })
  })
})
