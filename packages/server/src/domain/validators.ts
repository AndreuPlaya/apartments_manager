import type { Booking } from './models.js'

export function stripTime(isoString: string): string {
  const t = isoString.indexOf('T')
  return t === -1 ? isoString : isoString.slice(0, t)
}

export function isValidDateRange(fromDate: string, toDate: string): boolean {
  return Date.parse(toDate) > Date.parse(fromDate)
}

export function meetsMinNights(fromDate: string, toDate: string, minNights: number): boolean {
  const nights = (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000
  return nights >= minNights
}

export function datesOverlap(
  fromA: string, toA: string,
  fromB: string, toB: string,
): boolean {
  return fromA < toB && toA > fromB
}

export function findOverlappingBooking(
  bookings: Booking[],
  apartmentId: string,
  fromDate: string,
  toDate: string,
  excludeId?: string,
): Booking | null {
  for (const b of bookings) {
    if (b.apartmentId !== apartmentId) continue
    if (excludeId !== undefined && b.id === excludeId) continue
    if (datesOverlap(fromDate, toDate, b.fromDate, b.toDate)) return b
  }
  return null
}
