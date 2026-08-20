import type { MetricsResponse } from '../domain/models.js'
import { computeMetrics } from '../domain/metrics.js'
import * as apartments from '../infrastructure/repositories/apartments.js'
import * as bookings from '../infrastructure/repositories/bookings.js'

export function getMetrics(): MetricsResponse {
  const year = new Date().getFullYear()
  return computeMetrics(bookings.list(), apartments.count(), year)
}
