import type { Reservation, MetricsResponse, MonthlyOccupancy, MonthlyRevenue } from './models.js'
import { holdsDates, isBillable } from './reservationStatus.js'

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function toKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** The month key of every night in [checkIn, checkOut). */
function nightsOf(reservation: Reservation): string[] {
  const keys: string[] = []
  let cur = new Date(reservation.checkIn + 'T00:00:00Z')
  const end = new Date(reservation.checkOut + 'T00:00:00Z')
  while (cur < end) {
    keys.push(toKey(cur.getUTCFullYear(), cur.getUTCMonth() + 1))
    cur = new Date(cur.getTime() + 86_400_000)
  }
  return keys
}

/**
 * Occupancy counts the nights somebody occupied or is still expected to.
 *
 * It follows the lifecycle's *holds the dates* column exactly, so a listing's
 * occupancy and its calendar can never disagree — a cancelled week reads as free
 * in both (docs/RESERVATION_LIFECYCLE.md L9).
 */
export function computeOccupancy(
  reservations: Reservation[],
  yearRange: { start: number; end: number },
  totalListings: number,
): MonthlyOccupancy[] {
  const nightsMap = new Map<string, number>()

  for (const r of reservations) {
    if (!holdsDates(r.status)) continue
    for (const key of nightsOf(r)) {
      nightsMap.set(key, (nightsMap.get(key) ?? 0) + 1)
    }
  }

  const result: MonthlyOccupancy[] = []
  for (let y = yearRange.start; y <= yearRange.end; y++) {
    for (let m = 1; m <= 12; m++) {
      const bookedNights = nightsMap.get(toKey(y, m)) ?? 0
      const totalNights = daysInMonth(y, m)
      const occupancyRate =
        totalListings > 0
          ? Math.round((bookedNights / (totalListings * totalNights)) * 10_000) / 100
          : 0
      result.push({ year: y, month: m, occupancyRate, bookedNights, totalNights })
    }
  }
  return result
}

/**
 * Revenue counts what is owed, spread across the nights it was earned.
 *
 * Two rules from docs/RESERVATION_LIFECYCLE.md:
 *
 * - L10: every billable status counts, so a no-show appears here and not in
 *   occupancy — the guest owes the money precisely because they did not come.
 * - L11: a stay from 28 January to 4 February is split between the two months,
 *   not dumped on January. Attributing a whole stay to its check-in month
 *   misreports two months at once, and worst on exactly the long stays and
 *   turn-of-year figures a manager cares about.
 *
 * `commissionRateByChannel` holds each channel's cut as a percentage. Commission
 * and net are derived here and never stored, so re-rating a channel restates the
 * report rather than rewriting history.
 */
export function computeRevenue(
  reservations: Reservation[],
  yearRange: { start: number; end: number },
  commissionRateByChannel: ReadonlyMap<string, number> = new Map(),
): MonthlyRevenue[] {
  const grossMap = new Map<string, number>()
  const commissionMap = new Map<string, number>()

  for (const r of reservations) {
    if (!isBillable(r.status)) continue

    const nights = nightsOf(r)
    if (nights.length === 0) continue

    const perNight = r.totalAmountDue / nights.length
    const rate = commissionRateByChannel.get(r.channelId) ?? 0

    for (const key of nights) {
      grossMap.set(key, (grossMap.get(key) ?? 0) + perNight)
      commissionMap.set(key, (commissionMap.get(key) ?? 0) + (perNight * rate) / 100)
    }
  }

  const result: MonthlyRevenue[] = []
  let cumulative = 0

  for (let y = yearRange.start; y <= yearRange.end; y++) {
    // Cumulative revenue is a year-to-date figure, so it restarts each January.
    cumulative = 0
    for (let m = 1; m <= 12; m++) {
      const key = toKey(y, m)
      const revenue = round2(grossMap.get(key) ?? 0)
      const commission = round2(commissionMap.get(key) ?? 0)
      cumulative += revenue
      result.push({
        year: y,
        month: m,
        revenue,
        commission,
        netRevenue: round2(revenue - commission),
        cumulativeRevenue: round2(cumulative),
      })
    }
  }
  return result
}

export function computeMetrics(
  reservations: Reservation[],
  totalListings: number,
  referenceYear?: number,
  commissionRateByChannel?: ReadonlyMap<string, number>,
): MetricsResponse {
  const year = referenceYear ?? new Date().getFullYear()
  const yearRange = { start: year - 1, end: year + 1 }
  return {
    occupancy: computeOccupancy(reservations, yearRange, totalListings),
    revenue: computeRevenue(reservations, yearRange, commissionRateByChannel),
  }
}
