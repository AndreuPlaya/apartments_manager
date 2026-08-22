import type { Guest } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toParam, type Row } from './mapping.js'

const COLUMNS = 'id, identityDocument, name, email, phoneNumber, street, city, country, zipCode, comment'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toGuest(row: Row): Guest {
  return {
    id: row['id'] as string,
    identityDocument: opt<string>(row['identityDocument']),
    name: row['name'] as string,
    email: opt<string>(row['email']),
    phoneNumber: opt<string>(row['phoneNumber']),
    street: opt<string>(row['street']),
    city: opt<string>(row['city']),
    country: opt<string>(row['country']),
    zipCode: opt<string>(row['zipCode']),
    comment: opt<string>(row['comment']),
  }
}

function params(c: Guest): ReturnType<typeof toParam>[] {
  return [
    c.id, c.identityDocument, c.name, c.email, c.phoneNumber,
    c.street, c.city, c.country, c.zipCode, c.comment,
  ].map(toParam)
}

export function list(): Guest[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM guests ORDER BY name`).all().map(toGuest)
}

export function findById(id: string): Guest | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM guests WHERE id = ?`).get(id)
  return row === undefined ? null : toGuest(row)
}

export function findByIdentityDocument(document: string, excludeId?: string): Guest | null {
  const row = getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM guests WHERE upper(identityDocument) = upper(?) AND id IS NOT ?`,
    )
    .get(document, excludeId ?? null)
  return row === undefined ? null : toGuest(row)
}

export function findByEmail(email: string, excludeId?: string): Guest | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM guests WHERE lower(email) = lower(?) AND id IS NOT ?`)
    .get(email, excludeId ?? null)
  return row === undefined ? null : toGuest(row)
}

export function insert(guest: Guest): void {
  getDb().prepare(`INSERT INTO guests (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(guest))
}

export function update(guest: Guest): void {
  getDb()
    .prepare(
      `UPDATE guests SET
         identityDocument = ?, name = ?, email = ?, phoneNumber = ?,
         street = ?, city = ?, country = ?, zipCode = ?, comment = ?
       WHERE id = ?`,
    )
    .run(...params(guest).slice(1), guest.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM guests WHERE id = ?').run(id)
}
