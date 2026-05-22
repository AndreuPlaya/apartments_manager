import { randomUUID } from 'node:crypto'
import type { Booking, BookingFilters, CreateBookingRequest, UpdateBookingRequest } from '../domain/models.js'
import {
  findOverlappingBooking,
  isValidDateRange,
  meetsMinNights,
  stripTime,
} from '../domain/validators.js'
import {
  loadApartments,
  loadBookings,
  loadChannels,
  loadClients,
  queryBookings,
  saveBookings,
} from '../infrastructure/data.js'
import { ConflictError, NotFoundError, ValidationError } from './errors.js'

export function listBookings(filters: BookingFilters): Booking[] {
  return queryBookings(filters)
}

export function createBooking(req: CreateBookingRequest): Booking {
  const fromDate = stripTime(req.fromDate)
  const toDate = stripTime(req.toDate)

  if (!isValidDateRange(fromDate, toDate)) {
    throw new ValidationError('toDate must be after fromDate')
  }

  const apartments = loadApartments()
  const apartment = apartments.find((a) => a.id === req.apartmentId)
  if (apartment === undefined) {
    throw new ValidationError(`Apartment '${req.apartmentId}' not found`)
  }
  if (!apartment.isAvailable) {
    throw new ValidationError(`Apartment '${apartment.name}' is not available`)
  }

  if (!meetsMinNights(fromDate, toDate, apartment.minNights)) {
    throw new ValidationError(`Minimum ${apartment.minNights} night(s) required for '${apartment.name}'`)
  }

  const clients = loadClients()
  if (!clients.some((c) => c.id === req.clientId)) {
    throw new ValidationError(`Client '${req.clientId}' not found`)
  }

  const channels = loadChannels()
  const channel = channels.find((c) => c.id === req.channelId)
  if (channel === undefined) {
    throw new ValidationError(`Channel '${req.channelId}' not found`)
  }
  if (!channel.isActive) {
    throw new ValidationError(`Channel '${channel.name}' is not active`)
  }

  const allBookings = loadBookings()
  const overlap = findOverlappingBooking(allBookings, req.apartmentId, fromDate, toDate)
  if (overlap !== null) {
    throw new ConflictError(
      `Dates overlap with an existing booking (${overlap.fromDate} – ${overlap.toDate})`,
    )
  }

  const booking: Booking = {
    id: randomUUID(),
    ...req,
    fromDate,
    toDate,
    createdAt: new Date().toISOString(),
  }

  saveBookings([...allBookings, booking])
  return booking
}

export function updateBooking(id: string, req: UpdateBookingRequest): Booking {
  const allBookings = loadBookings()
  const idx = allBookings.findIndex((b) => b.id === id)
  if (idx === -1) throw new NotFoundError(`Booking '${id}' not found`)

  const existing = allBookings[idx]!
  const merged: Booking = { ...existing, ...req }

  // Normalise dates
  merged.fromDate = stripTime(merged.fromDate)
  merged.toDate = stripTime(merged.toDate)

  const datesChanged =
    req.fromDate !== undefined ||
    req.toDate !== undefined ||
    req.apartmentId !== undefined

  if (datesChanged) {
    if (!isValidDateRange(merged.fromDate, merged.toDate)) {
      throw new ValidationError('toDate must be after fromDate')
    }

    const apartments = loadApartments()
    const apartment = apartments.find((a) => a.id === merged.apartmentId)
    if (apartment === undefined) {
      throw new ValidationError(`Apartment '${merged.apartmentId}' not found`)
    }
    if (!apartment.isAvailable) {
      throw new ValidationError(`Apartment '${apartment.name}' is not available`)
    }
    if (!meetsMinNights(merged.fromDate, merged.toDate, apartment.minNights)) {
      throw new ValidationError(`Minimum ${apartment.minNights} night(s) required for '${apartment.name}'`)
    }

    const overlap = findOverlappingBooking(allBookings, merged.apartmentId, merged.fromDate, merged.toDate, id)
    if (overlap !== null) {
      throw new ConflictError(
        `Dates overlap with an existing booking (${overlap.fromDate} – ${overlap.toDate})`,
      )
    }
  }

  if (req.channelId !== undefined) {
    const channels = loadChannels()
    const channel = channels.find((c) => c.id === req.channelId)
    if (channel === undefined) throw new ValidationError(`Channel '${req.channelId}' not found`)
    if (!channel.isActive) throw new ValidationError(`Channel '${channel.name}' is not active`)
  }

  if (req.clientId !== undefined) {
    const clients = loadClients()
    if (!clients.some((c) => c.id === req.clientId)) {
      throw new ValidationError(`Client '${req.clientId}' not found`)
    }
  }

  allBookings[idx] = merged
  saveBookings(allBookings)
  return merged
}

export function patchBookingFields(
  id: string,
  req: { comment?: string; status?: import('../domain/models.js').BookingStatus },
): Booking {
  const allBookings = loadBookings()
  const idx = allBookings.findIndex((b) => b.id === id)
  if (idx === -1) throw new NotFoundError(`Booking '${id}' not found`)
  const updated: Booking = { ...allBookings[idx]!, ...req }
  allBookings[idx] = updated
  saveBookings(allBookings)
  return updated
}

export function deleteBooking(id: string): void {
  const all = loadBookings()
  const idx = all.findIndex((b) => b.id === id)
  if (idx === -1) throw new NotFoundError(`Booking '${id}' not found`)
  saveBookings(all.filter((b) => b.id !== id))
}
