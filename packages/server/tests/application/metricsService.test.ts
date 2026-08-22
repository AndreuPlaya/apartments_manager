import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/domain/metrics.js')

import { getMetrics } from '../../src/application/metricsService.js'
import { computeMetrics } from '../../src/domain/metrics.js'
import { CHANNEL, seedBase, seedReservation, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  vi.mocked(computeMetrics).mockReturnValue({ occupancy: [], revenue: [] })
})

describe('getMetrics', () => {
  it('calls computeMetrics with reservations, listing count, year and channel rates', () => {
    seedBase()
    const reservation = seedReservation()

    const result = getMetrics()

    expect(computeMetrics).toHaveBeenCalledWith(
      [reservation],
      1,
      new Date().getFullYear(),
      new Map([[CHANNEL.id, CHANNEL.commissionRate]]),
    )
    expect(result).toEqual({ occupancy: [], revenue: [] })
  })
})
