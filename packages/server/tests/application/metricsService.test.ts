import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Apartment, Booking } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/data.js')
vi.mock('../../src/domain/metrics.js')

import { loadApartments, loadBookings } from '../../src/infrastructure/data.js'
import { computeMetrics } from '../../src/domain/metrics.js'
import { getMetrics } from '../../src/application/metricsService.js'

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
