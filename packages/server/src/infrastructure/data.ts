import type {
  Apartment,
  Booking,
  BookingFilters,
  CalendarLink,
  Channel,
  Client,
  Property,
} from '../domain/models.js'
import { datesOverlap } from '../domain/validators.js'
import { readJson, writeJson } from './fs.js'
import { PATHS } from './paths.js'

// ── Apartments ────────────────────────────────────────────────────────────

export function loadApartments(): Apartment[] {
  return readJson<Apartment[]>(PATHS.apartmentsJson, [])
}

export function saveApartments(apartments: Apartment[]): void {
  writeJson(PATHS.apartmentsJson, apartments)
}

// ── Properties ────────────────────────────────────────────────────────────

export function loadProperties(): Property[] {
  return readJson<Property[]>(PATHS.propertiesJson, [])
}

export function saveProperties(properties: Property[]): void {
  writeJson(PATHS.propertiesJson, properties)
}

// ── Bookings ──────────────────────────────────────────────────────────────

export function loadBookings(): Booking[] {
  const raw = readJson<any[]>(PATHS.bookingsJson, [])
  return raw.map((b): Booking => {
    if (b.status === 'NotPaid') return { ...b, status: 'Active' }
    if (b.status === 'Paid') return { ...b, status: 'Active', paidDate: b.paidDate ?? b.createdAt.split('T')[0] }
    return b as Booking
  })
}

export function saveBookings(bookings: Booking[]): void {
  writeJson(PATHS.bookingsJson, bookings)
}

export function queryBookings(filters: BookingFilters): Booking[] {
  let bookings = loadBookings()

  if (filters.apartmentId !== undefined) {
    bookings = bookings.filter((b) => b.apartmentId === filters.apartmentId)
  }

  if (filters.from !== undefined && filters.to !== undefined) {
    bookings = bookings.filter((b) => datesOverlap(b.fromDate, b.toDate, filters.from!, filters.to!))
  } else if (filters.from !== undefined) {
    bookings = bookings.filter((b) => b.toDate > filters.from!)
  } else if (filters.to !== undefined) {
    bookings = bookings.filter((b) => b.fromDate < filters.to!)
  }

  return bookings
}

// ── Clients ───────────────────────────────────────────────────────────────

export function loadClients(): Client[] {
  return readJson<Client[]>(PATHS.clientsJson, [])
}

export function saveClients(clients: Client[]): void {
  writeJson(PATHS.clientsJson, clients)
}

// ── Channels ──────────────────────────────────────────────────────────────

export function loadChannels(): Channel[] {
  return readJson<Channel[]>(PATHS.channelsJson, [])
}

export function saveChannels(channels: Channel[]): void {
  writeJson(PATHS.channelsJson, channels)
}

// ── Calendar Links ────────────────────────────────────────────────────────

export function loadCalendarLinks(): CalendarLink[] {
  return readJson<CalendarLink[]>(PATHS.calendarLinksJson, [])
}

export function saveCalendarLinks(links: CalendarLink[]): void {
  writeJson(PATHS.calendarLinksJson, links)
}
