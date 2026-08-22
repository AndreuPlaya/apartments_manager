import { randomUUID } from 'node:crypto'
import type {
  Reservation,
  ReservationFilters,
  ReservationStatus,
  CreateReservationRequest,
  UpdateReservationRequest,
} from '../domain/models.js'
import { allowedTransitions, canTransition } from '../domain/reservationStatus.js'
import { isValidDateRange, meetsMinNights, stripTime } from '../domain/validators.js'
import { transaction } from '../infrastructure/db.js'
import * as listings from '../infrastructure/repositories/listings.js'
import * as reservations from '../infrastructure/repositories/reservations.js'
import * as channels from '../infrastructure/repositories/channels.js'
import * as guests from '../infrastructure/repositories/guests.js'
import { ConflictError, NotFoundError, ValidationError } from './errors.js'

/** Validates the stay against the listing and returns nothing on success. */
function assertStayIsBookable(
  listingId: string,
  checkIn: string,
  checkOut: string,
  adultCount: number,
): void {
  if (!isValidDateRange(checkIn, checkOut)) {
    throw new ValidationError('checkOut must be after checkIn')
  }

  const listing = listings.findById(listingId)
  if (listing === null) {
    throw new ValidationError(`Listing '${listingId}' not found`)
  }
  if (!listing.isActive) {
    throw new ValidationError(`Listing '${listing.name}' is not active`)
  }
  if (!meetsMinNights(checkIn, checkOut, listing.minNights)) {
    throw new ValidationError(`Minimum ${listing.minNights} night(s) required for '${listing.name}'`)
  }
  if (adultCount > listing.maxAdults) {
    throw new ValidationError(
      `Maximum ${listing.maxAdults} adult(s) for '${listing.name}' (${adultCount} requested)`,
    )
  }
}

/**
 * Cancelled and no-show reservations are invisible here: `findOverlapping` only
 * looks at the statuses that hold their dates, so cancelling a stay makes the
 * week sellable the same second (docs/RESERVATION_LIFECYCLE.md L5).
 */
function assertNoOverlap(listingId: string, checkIn: string, checkOut: string, excludeId?: string): void {
  const overlap = reservations.findOverlapping(listingId, checkIn, checkOut, excludeId)
  if (overlap !== null) {
    throw new ConflictError(
      `Dates overlap with an existing reservation (${overlap.checkIn} – ${overlap.checkOut})`,
    )
  }
}

function assertChannelIsUsable(channelId: string): void {
  const channel = channels.findById(channelId)
  if (channel === null) throw new ValidationError(`Channel '${channelId}' not found`)
  if (!channel.isActive) throw new ValidationError(`Channel '${channel.name}' is not active`)
}

function assertGuestExists(guestId: string): void {
  if (guests.findById(guestId) === null) {
    throw new ValidationError(`Guest '${guestId}' not found`)
  }
}

export function listReservations(filters: ReservationFilters): Reservation[] {
  return reservations.query(filters)
}

export function createReservation(req: CreateReservationRequest): Reservation {
  const checkIn = stripTime(req.checkIn)
  const checkOut = stripTime(req.checkOut)

  // The overlap check and the insert share one immediate transaction, so two
  // concurrent requests cannot both pass the check for the same dates.
  return transaction(() => {
    assertStayIsBookable(req.listingId, checkIn, checkOut, req.adultCount)
    assertGuestExists(req.guestId)
    assertChannelIsUsable(req.channelId)
    assertNoOverlap(req.listingId, checkIn, checkOut)

    const reservation: Reservation = {
      id: randomUUID(),
      ...req,
      checkIn,
      checkOut,
      // Not the caller's to choose: nothing enters the register already
      // arrived, cancelled or closed (docs/RESERVATION_LIFECYCLE.md L1).
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    }
    reservations.insert(reservation)
    return reservation
  })
}

/**
 * The full-edit path. `options.override` lifts the lifecycle graph only — every
 * stay rule still applies, because an override is a correction of a *statement*,
 * not a licence to double-book (docs/RESERVATION_LIFECYCLE.md L4).
 */
export function updateReservation(
  id: string,
  req: UpdateReservationRequest,
  options: { override?: boolean } = {},
): Reservation {
  return transaction(() => {
    const existing = reservations.findById(id)
    if (existing === null) throw new NotFoundError(`Reservation '${id}' not found`)

    const merged: Reservation = { ...existing, ...req }
    merged.checkIn = stripTime(merged.checkIn)
    merged.checkOut = stripTime(merged.checkOut)

    const stayChanged =
      req.checkIn !== undefined ||
      req.checkOut !== undefined ||
      req.listingId !== undefined ||
      req.adultCount !== undefined

    if (stayChanged) {
      assertStayIsBookable(merged.listingId, merged.checkIn, merged.checkOut, merged.adultCount)
      assertNoOverlap(merged.listingId, merged.checkIn, merged.checkOut, id)
    }

    if (req.channelId !== undefined) assertChannelIsUsable(req.channelId)
    if (req.guestId !== undefined) assertGuestExists(req.guestId)
    if (req.status !== undefined) {
      assertTransitionAllowed(existing.status, req.status, options.override === true)
    }

    reservations.update(merged)
    return merged
  })
}

/**
 * Guards a status change against the lifecycle graph.
 *
 * `override` is the reference's manual override (A8) applied to the state
 * machine: the rules exist to keep the daily flow honest, never to stop a
 * trusted operator correcting the register. It is admin-only
 * (docs/ACCESS_LEVELS.md §2), so the caller has to say so explicitly.
 */
function assertTransitionAllowed(
  from: ReservationStatus,
  to: ReservationStatus,
  override: boolean,
): void {
  if (override || canTransition(from, to)) return

  const allowed = allowedTransitions(from)
  throw new ValidationError(
    allowed.length === 0
      ? `A ${from} reservation is final and cannot become ${to}`
      : `Cannot go from ${from} to ${to} (allowed: ${allowed.join(', ')})`,
  )
}

/**
 * The inline-edit path: comment, payment date and status only.
 *
 * It skips the stay validation on purpose — none of these fields can invalidate
 * the dates — but it does *not* skip the lifecycle check, which is exactly the
 * rule this path used to bypass.
 */
export function patchReservationFields(
  id: string,
  req: { comment?: string; status?: ReservationStatus; paidDate?: string },
  options: { override?: boolean } = {},
): Reservation {
  return transaction(() => {
    const existing = reservations.findById(id)
    if (existing === null) throw new NotFoundError(`Reservation '${id}' not found`)

    if (req.status !== undefined) {
      assertTransitionAllowed(existing.status, req.status, options.override === true)
    }

    const updated: Reservation = { ...existing, ...req }
    reservations.update(updated)
    return updated
  })
}

export function deleteReservation(id: string): void {
  transaction(() => {
    if (reservations.findById(id) === null) throw new NotFoundError(`Reservation '${id}' not found`)
    reservations.deleteById(id)
  })
}
