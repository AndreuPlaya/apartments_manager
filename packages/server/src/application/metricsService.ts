import type { MetricsResponse } from '../domain/models.js'
import { computeMetrics } from '../domain/metrics.js'
import { loadApartments, loadBookings } from '../infrastructure/data.js'

export function getMetrics(): MetricsResponse {
  const bookings = loadBookings()
  const apartments = loadApartments()
  const year = new Date().getFullYear()
  return computeMetrics(bookings, apartments.length, year)
}
