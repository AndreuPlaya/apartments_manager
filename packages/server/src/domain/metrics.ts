import type { Booking, MetricsResponse, MonthlyOccupancy, MonthlyRevenue } from './models.js'

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function toKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function computeOccupancy(
  bookings: Booking[],
  yearRange: { start: number; end: number },
  totalApartments: number,
): MonthlyOccupancy[] {
  const nightsMap = new Map<string, number>()

  for (const b of bookings) {
    let cur = new Date(b.fromDate + 'T00:00:00Z')
    const end = new Date(b.toDate + 'T00:00:00Z')
    while (cur < end) {
      const y = cur.getUTCFullYear()
      const m = cur.getUTCMonth() + 1
      if (y >= yearRange.start && y <= yearRange.end) {
        const key = toKey(y, m)
        nightsMap.set(key, (nightsMap.get(key) ?? 0) + 1)
      }
      cur = new Date(cur.getTime() + 86_400_000)
    }
  }

  const result: MonthlyOccupancy[] = []
  for (let y = yearRange.start; y <= yearRange.end; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = toKey(y, m)
      const bookedNights = nightsMap.get(key) ?? 0
      const totalNights = daysInMonth(y, m)
      const occupancyRate =
        totalApartments > 0
          ? Math.round((bookedNights / (totalApartments * totalNights)) * 10_000) / 100
          : 0
      result.push({ year: y, month: m, occupancyRate, bookedNights, totalNights })
    }
  }
  return result
}

export function computeRevenue(
  bookings: Booking[],
  yearRange: { start: number; end: number },
): MonthlyRevenue[] {
  const revenueMap = new Map<string, number>()

  for (const b of bookings) {
    const d = new Date(b.fromDate + 'T00:00:00Z')
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    if (y >= yearRange.start && y <= yearRange.end) {
      const key = toKey(y, m)
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + b.totalAmountDue)
    }
  }

  const result: MonthlyRevenue[] = []
  let cumulative = 0
  let lastYear = yearRange.start

  for (let y = yearRange.start; y <= yearRange.end; y++) {
    if (y !== lastYear) {
      cumulative = 0
      lastYear = y
    }
    for (let m = 1; m <= 12; m++) {
      const revenue = revenueMap.get(toKey(y, m)) ?? 0
      cumulative += revenue
      result.push({ year: y, month: m, revenue, cumulativeRevenue: Math.round(cumulative * 100) / 100 })
    }
  }
  return result
}

export function computeMetrics(
  bookings: Booking[],
  totalApartments: number,
  referenceYear?: number,
): MetricsResponse {
  const year = referenceYear ?? new Date().getFullYear()
  const yearRange = { start: year - 1, end: year + 1 }
  return {
    occupancy: computeOccupancy(bookings, yearRange, totalApartments),
    revenue: computeRevenue(bookings, yearRange),
  }
}
