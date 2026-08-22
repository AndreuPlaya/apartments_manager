import type { MetricsResponse } from '../domain/models.js'
import { computeMetrics } from '../domain/metrics.js'
import * as channels from '../infrastructure/repositories/channels.js'
import * as listings from '../infrastructure/repositories/listings.js'
import * as reservations from '../infrastructure/repositories/reservations.js'

export function getMetrics(): MetricsResponse {
  const year = new Date().getFullYear()
  const commissionRateByChannel = new Map(channels.list().map((c) => [c.id, c.commissionRate]))
  return computeMetrics(reservations.list(), listings.count(), year, commissionRateByChannel)
}
