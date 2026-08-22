import type { Reservation, ReservationFilters } from '../../domain/models.js'
import { DATE_HOLDING_STATUSES } from '../../domain/reservationStatus.js'
import { getDb } from '../db.js'
import { opt, toParam, type Row } from './mapping.js'

const COLUMNS =
  'id, listingId, guestId, channelId, checkIn, checkOut, adultCount, childrenCount, ' +
  'cribRequested, status, paidDate, totalAmountDue, comment, createdAt'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toReservation(row: Row): Reservation {
  const crib = row['cribRequested']
  return {
    id: row['id'] as string,
    listingId: row['listingId'] as string,
    guestId: row['guestId'] as string,
    channelId: row['channelId'] as string,
    checkIn: row['checkIn'] as string,
    checkOut: row['checkOut'] as string,
    adultCount: row['adultCount'] as number,
    childrenCount: row['childrenCount'] as number,
    cribRequested: crib === null || crib === undefined ? undefined : crib === 1,
    status: row['status'] as Reservation['status'],
    paidDate: opt<string>(row['paidDate']),
    totalAmountDue: row['totalAmountDue'] as number,
    comment: opt<string>(row['comment']),
    createdAt: row['createdAt'] as string,
  }
}

function params(b: Reservation): ReturnType<typeof toParam>[] {
  return [
    b.id, b.listingId, b.guestId, b.channelId, b.checkIn, b.checkOut,
    b.adultCount, b.childrenCount, b.cribRequested, b.status, b.paidDate,
    b.totalAmountDue, b.comment, b.createdAt,
  ].map(toParam)
}

export function list(): Reservation[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM reservations ORDER BY checkIn`).all().map(toReservation)
}

/**
 * A reservation matches when its stay intersects the requested window. Stays are
 * half-open: the checkout day is free for the next guest.
 */
export function query(filters: ReservationFilters): Reservation[] {
  const clauses: string[] = []
  const values: (string | null)[] = []

  if (filters.listingId !== undefined) {
    clauses.push('listingId = ?')
    values.push(filters.listingId)
  }
  if (filters.from !== undefined) {
    clauses.push('checkOut > ?')
    values.push(filters.from)
  }
  if (filters.to !== undefined) {
    clauses.push('checkIn < ?')
    values.push(filters.to)
  }

  const where = clauses.length === 0 ? '' : ` WHERE ${clauses.join(' AND ')}`
  return getDb()
    .prepare(`SELECT ${COLUMNS} FROM reservations${where} ORDER BY checkIn`)
    .all(...values)
    .map(toReservation)
}

export function findById(id: string): Reservation | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM reservations WHERE id = ?`).get(id)
  return row === undefined ? null : toReservation(row)
}

const HOLDING_PLACEHOLDERS = DATE_HOLDING_STATUSES.map(() => '?').join(', ')

/**
 * Returns a reservation of the same listing whose stay intersects [checkIn, checkOut).
 * Callers that follow this with a write must run both inside `transaction()`.
 *
 * Only statuses that hold their dates count. A cancelled or no-show stay is not
 * an obstacle — nobody occupied those nights, so the week is sellable again
 * (docs/RESERVATION_LIFECYCLE.md L5).
 */
export function findOverlapping(
  listingId: string,
  checkIn: string,
  checkOut: string,
  excludeId?: string,
): Reservation | null {
  const row = getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM reservations
       WHERE listingId = ? AND ? < checkOut AND ? > checkIn AND id IS NOT ?
         AND status IN (${HOLDING_PLACEHOLDERS})
       ORDER BY checkIn LIMIT 1`,
    )
    .get(listingId, checkIn, checkOut, excludeId ?? null, ...DATE_HOLDING_STATUSES)
  return row === undefined ? null : toReservation(row)
}

function existsWhere(column: 'listingId' | 'guestId' | 'channelId', id: string): boolean {
  const row = getDb().prepare(`SELECT 1 AS hit FROM reservations WHERE ${column} = ? LIMIT 1`).get(id)
  return row !== undefined
}

export function existsForListing(listingId: string): boolean {
  return existsWhere('listingId', listingId)
}

export function existsForGuest(guestId: string): boolean {
  return existsWhere('guestId', guestId)
}

export function existsForChannel(channelId: string): boolean {
  return existsWhere('channelId', channelId)
}

export function insert(reservation: Reservation): void {
  getDb().prepare(`INSERT INTO reservations (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(reservation))
}

export function update(reservation: Reservation): void {
  getDb()
    .prepare(
      `UPDATE reservations SET
         listingId = ?, guestId = ?, channelId = ?, checkIn = ?, checkOut = ?,
         adultCount = ?, childrenCount = ?, cribRequested = ?, status = ?,
         paidDate = ?, totalAmountDue = ?, comment = ?, createdAt = ?
       WHERE id = ?`,
    )
    .run(...params(reservation).slice(1), reservation.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM reservations WHERE id = ?').run(id)
}
