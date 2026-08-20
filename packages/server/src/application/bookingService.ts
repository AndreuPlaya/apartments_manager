import { randomUUID } from 'node:crypto'
import type {
  Booking,
  BookingFilters,
  BookingStatus,
  CreateBookingRequest,
  UpdateBookingRequest,
} from '../domain/models.js'
import { isValidDateRange, meetsMinNights, stripTime } from '../domain/validators.js'
import { transaction } from '../infrastructure/db.js'
import * as apartments from '../infrastructure/repositories/apartments.js'
import * as bookings from '../infrastructure/repositories/bookings.js'
import * as channels from '../infrastructure/repositories/channels.js'
import * as clients from '../infrastructure/repositories/clients.js'
import { ConflictError, NotFoundError, ValidationError } from './errors.js'

/** Validates the stay against the apartment and returns nothing on success. */
function assertStayIsBookable(apartmentId: string, fromDate: string, toDate: string): void {
  if (!isValidDateRange(fromDate, toDate)) {
    throw new ValidationError('toDate must be after fromDate')
  }

  const apartment = apartments.findById(apartmentId)
  if (apartment === null) {
    throw new ValidationError(`Apartment '${apartmentId}' not found`)
  }
  if (!apartment.isAvailable) {
    throw new ValidationError(`Apartment '${apartment.name}' is not available`)
  }
  if (!meetsMinNights(fromDate, toDate, apartment.minNights)) {
    throw new ValidationError(`Minimum ${apartment.minNights} night(s) required for '${apartment.name}'`)
  }
}

function assertNoOverlap(apartmentId: string, fromDate: string, toDate: string, excludeId?: string): void {
  const overlap = bookings.findOverlapping(apartmentId, fromDate, toDate, excludeId)
  if (overlap !== null) {
    throw new ConflictError(
      `Dates overlap with an existing booking (${overlap.fromDate} – ${overlap.toDate})`,
    )
  }
}

function assertChannelIsUsable(channelId: string): void {
  const channel = channels.findById(channelId)
  if (channel === null) throw new ValidationError(`Channel '${channelId}' not found`)
  if (!channel.isActive) throw new ValidationError(`Channel '${channel.name}' is not active`)
}

function assertClientExists(clientId: string): void {
  if (clients.findById(clientId) === null) {
    throw new ValidationError(`Client '${clientId}' not found`)
  }
}

export function listBookings(filters: BookingFilters): Booking[] {
  return bookings.query(filters)
}

export function createBooking(req: CreateBookingRequest): Booking {
  const fromDate = stripTime(req.fromDate)
  const toDate = stripTime(req.toDate)

  // The overlap check and the insert share one immediate transaction, so two
  // concurrent requests cannot both pass the check for the same dates.
  return transaction(() => {
    assertStayIsBookable(req.apartmentId, fromDate, toDate)
    assertClientExists(req.clientId)
    assertChannelIsUsable(req.channelId)
    assertNoOverlap(req.apartmentId, fromDate, toDate)

    const booking: Booking = {
      id: randomUUID(),
      ...req,
      fromDate,
      toDate,
      createdAt: new Date().toISOString(),
    }
    bookings.insert(booking)
    return booking
  })
}

export function updateBooking(id: string, req: UpdateBookingRequest): Booking {
  return transaction(() => {
    const existing = bookings.findById(id)
    if (existing === null) throw new NotFoundError(`Booking '${id}' not found`)

    const merged: Booking = { ...existing, ...req }
    merged.fromDate = stripTime(merged.fromDate)
    merged.toDate = stripTime(merged.toDate)

    const datesChanged =
      req.fromDate !== undefined || req.toDate !== undefined || req.apartmentId !== undefined

    if (datesChanged) {
      assertStayIsBookable(merged.apartmentId, merged.fromDate, merged.toDate)
      assertNoOverlap(merged.apartmentId, merged.fromDate, merged.toDate, id)
    }

    if (req.channelId !== undefined) assertChannelIsUsable(req.channelId)
    if (req.clientId !== undefined) assertClientExists(req.clientId)

    bookings.update(merged)
    return merged
  })
}

export function patchBookingFields(
  id: string,
  req: { comment?: string; status?: BookingStatus; paidDate?: string },
): Booking {
  return transaction(() => {
    const existing = bookings.findById(id)
    if (existing === null) throw new NotFoundError(`Booking '${id}' not found`)

    const updated: Booking = { ...existing, ...req }
    bookings.update(updated)
    return updated
  })
}

export function deleteBooking(id: string): void {
  transaction(() => {
    if (bookings.findById(id) === null) throw new NotFoundError(`Booking '${id}' not found`)
    bookings.deleteById(id)
  })
}
