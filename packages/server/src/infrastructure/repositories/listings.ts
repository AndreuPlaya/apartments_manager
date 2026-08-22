import type { Listing } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toBool, toParam, type Row } from './mapping.js'

const COLUMNS =
  'id, name, address, floor, door, nightlyRate, minNights, maxAdults, rooms, bathrooms, isActive, description'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toListing(row: Row): Listing {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    address: row['address'] as string,
    floor: row['floor'] as number,
    door: row['door'] as string,
    nightlyRate: row['nightlyRate'] as number,
    minNights: row['minNights'] as number,
    maxAdults: row['maxAdults'] as number,
    rooms: row['rooms'] as number,
    bathrooms: row['bathrooms'] as number,
    isActive: toBool(row['isActive']),
    description: opt<string>(row['description']),
  }
}

function params(a: Listing): ReturnType<typeof toParam>[] {
  return [
    a.id, a.name, a.address, a.floor, a.door, a.nightlyRate,
    a.minNights, a.maxAdults, a.rooms, a.bathrooms,
    a.isActive, a.description,
  ].map(toParam)
}

export function list(): Listing[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM listings ORDER BY name`).all().map(toListing)
}

export function findById(id: string): Listing | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM listings WHERE id = ?`).get(id)
  return row === undefined ? null : toListing(row)
}

export function findByName(name: string, excludeId?: string): Listing | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM listings WHERE lower(name) = lower(?) AND id IS NOT ?`)
    .get(name, excludeId ?? null)
  return row === undefined ? null : toListing(row)
}

export function count(): number {
  return getDb().prepare('SELECT count(*) AS c FROM listings').get()!['c'] as number
}

export function insert(listing: Listing): void {
  getDb()
    .prepare(`INSERT INTO listings (${COLUMNS}) VALUES (${PLACEHOLDERS})`)
    .run(...params(listing))
}

export function update(listing: Listing): void {
  getDb()
    .prepare(
      `UPDATE listings SET
         name = ?, address = ?, floor = ?, door = ?, nightlyRate = ?, minNights = ?,
         maxAdults = ?, rooms = ?, bathrooms = ?, isActive = ?, description = ?
       WHERE id = ?`,
    )
    .run(...params(listing).slice(1), listing.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM listings WHERE id = ?').run(id)
}
