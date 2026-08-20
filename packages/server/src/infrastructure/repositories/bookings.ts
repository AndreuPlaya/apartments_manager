import type { Booking, BookingFilters } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toParam, type Row } from './mapping.js'

const COLUMNS =
  'id, apartmentId, clientId, channelId, fromDate, toDate, adultCount, childrenCount, ' +
  'cribRequested, status, paidDate, totalAmountDue, comment, createdAt'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toBooking(row: Row): Booking {
  const crib = row['cribRequested']
  return {
    id: row['id'] as string,
    apartmentId: row['apartmentId'] as string,
    clientId: row['clientId'] as string,
    channelId: row['channelId'] as string,
    fromDate: row['fromDate'] as string,
    toDate: row['toDate'] as string,
    adultCount: row['adultCount'] as number,
    childrenCount: row['childrenCount'] as number,
    cribRequested: crib === null || crib === undefined ? undefined : crib === 1,
    status: row['status'] as Booking['status'],
    paidDate: opt<string>(row['paidDate']),
    totalAmountDue: row['totalAmountDue'] as number,
    comment: opt<string>(row['comment']),
    createdAt: row['createdAt'] as string,
  }
}

function params(b: Booking): ReturnType<typeof toParam>[] {
  return [
    b.id, b.apartmentId, b.clientId, b.channelId, b.fromDate, b.toDate,
    b.adultCount, b.childrenCount, b.cribRequested, b.status, b.paidDate,
    b.totalAmountDue, b.comment, b.createdAt,
  ].map(toParam)
}

export function list(): Booking[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM bookings ORDER BY fromDate`).all().map(toBooking)
}

/**
 * A booking matches when its stay intersects the requested window. Stays are
 * half-open: the checkout day is free for the next guest.
 */
export function query(filters: BookingFilters): Booking[] {
  const clauses: string[] = []
  const values: (string | null)[] = []

  if (filters.apartmentId !== undefined) {
    clauses.push('apartmentId = ?')
    values.push(filters.apartmentId)
  }
  if (filters.from !== undefined) {
    clauses.push('toDate > ?')
    values.push(filters.from)
  }
  if (filters.to !== undefined) {
    clauses.push('fromDate < ?')
    values.push(filters.to)
  }

  const where = clauses.length === 0 ? '' : ` WHERE ${clauses.join(' AND ')}`
  return getDb()
    .prepare(`SELECT ${COLUMNS} FROM bookings${where} ORDER BY fromDate`)
    .all(...values)
    .map(toBooking)
}

export function findById(id: string): Booking | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM bookings WHERE id = ?`).get(id)
  return row === undefined ? null : toBooking(row)
}

/**
 * Returns a booking of the same apartment whose stay intersects [fromDate, toDate).
 * Callers that follow this with a write must run both inside `transaction()`.
 */
export function findOverlapping(
  apartmentId: string,
  fromDate: string,
  toDate: string,
  excludeId?: string,
): Booking | null {
  const row = getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM bookings
       WHERE apartmentId = ? AND ? < toDate AND ? > fromDate AND id IS NOT ?
       ORDER BY fromDate LIMIT 1`,
    )
    .get(apartmentId, fromDate, toDate, excludeId ?? null)
  return row === undefined ? null : toBooking(row)
}

function existsWhere(column: 'apartmentId' | 'clientId' | 'channelId', id: string): boolean {
  const row = getDb().prepare(`SELECT 1 AS hit FROM bookings WHERE ${column} = ? LIMIT 1`).get(id)
  return row !== undefined
}

export function existsForApartment(apartmentId: string): boolean {
  return existsWhere('apartmentId', apartmentId)
}

export function existsForClient(clientId: string): boolean {
  return existsWhere('clientId', clientId)
}

export function existsForChannel(channelId: string): boolean {
  return existsWhere('channelId', channelId)
}

export function insert(booking: Booking): void {
  getDb().prepare(`INSERT INTO bookings (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(booking))
}

export function update(booking: Booking): void {
  getDb()
    .prepare(
      `UPDATE bookings SET
         apartmentId = ?, clientId = ?, channelId = ?, fromDate = ?, toDate = ?,
         adultCount = ?, childrenCount = ?, cribRequested = ?, status = ?,
         paidDate = ?, totalAmountDue = ?, comment = ?, createdAt = ?
       WHERE id = ?`,
    )
    .run(...params(booking).slice(1), booking.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM bookings WHERE id = ?').run(id)
}
