import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/domain/metrics.js')

import { getMetrics } from '../../src/application/metricsService.js'
import { computeMetrics } from '../../src/domain/metrics.js'
import { seedBase, seedBooking, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  vi.mocked(computeMetrics).mockReturnValue({ occupancy: [], revenue: [] })
})

describe('getMetrics', () => {
  it('calls computeMetrics with bookings, apartment count, and current year', () => {
    seedBase()
    const booking = seedBooking()

    const result = getMetrics()

    expect(computeMetrics).toHaveBeenCalledWith([booking], 1, new Date().getFullYear())
    expect(result).toEqual({ occupancy: [], revenue: [] })
  })
})
