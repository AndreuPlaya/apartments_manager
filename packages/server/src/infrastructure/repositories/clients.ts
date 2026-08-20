import type { Client } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toParam, type Row } from './mapping.js'

const COLUMNS = 'id, identityDocument, name, email, phoneNumber, street, city, country, zipCode, comment'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toClient(row: Row): Client {
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

function params(c: Client): ReturnType<typeof toParam>[] {
  return [
    c.id, c.identityDocument, c.name, c.email, c.phoneNumber,
    c.street, c.city, c.country, c.zipCode, c.comment,
  ].map(toParam)
}

export function list(): Client[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM clients ORDER BY name`).all().map(toClient)
}

export function findById(id: string): Client | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM clients WHERE id = ?`).get(id)
  return row === undefined ? null : toClient(row)
}

export function findByIdentityDocument(document: string, excludeId?: string): Client | null {
  const row = getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM clients WHERE upper(identityDocument) = upper(?) AND id IS NOT ?`,
    )
    .get(document, excludeId ?? null)
  return row === undefined ? null : toClient(row)
}

export function findByEmail(email: string, excludeId?: string): Client | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM clients WHERE lower(email) = lower(?) AND id IS NOT ?`)
    .get(email, excludeId ?? null)
  return row === undefined ? null : toClient(row)
}

export function insert(client: Client): void {
  getDb().prepare(`INSERT INTO clients (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(client))
}

export function update(client: Client): void {
  getDb()
    .prepare(
      `UPDATE clients SET
         identityDocument = ?, name = ?, email = ?, phoneNumber = ?,
         street = ?, city = ?, country = ?, zipCode = ?, comment = ?
       WHERE id = ?`,
    )
    .run(...params(client).slice(1), client.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM clients WHERE id = ?').run(id)
}
