import type { Apartment } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toBool, toParam, type Row } from './mapping.js'

const COLUMNS =
  'id, name, address, floor, door, price, minNights, maxGuests, rooms, bathrooms, isAvailable, description'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toApartment(row: Row): Apartment {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    address: row['address'] as string,
    floor: row['floor'] as number,
    door: row['door'] as string,
    price: row['price'] as number,
    minNights: row['minNights'] as number,
    maxGuests: row['maxGuests'] as number,
    rooms: row['rooms'] as number,
    bathrooms: row['bathrooms'] as number,
    isAvailable: toBool(row['isAvailable']),
    description: opt<string>(row['description']),
  }
}

function params(a: Apartment): ReturnType<typeof toParam>[] {
  return [
    a.id, a.name, a.address, a.floor, a.door, a.price,
    a.minNights, a.maxGuests, a.rooms, a.bathrooms,
    a.isAvailable, a.description,
  ].map(toParam)
}

export function list(): Apartment[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM apartments ORDER BY name`).all().map(toApartment)
}

export function findById(id: string): Apartment | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM apartments WHERE id = ?`).get(id)
  return row === undefined ? null : toApartment(row)
}

export function findByName(name: string, excludeId?: string): Apartment | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM apartments WHERE lower(name) = lower(?) AND id IS NOT ?`)
    .get(name, excludeId ?? null)
  return row === undefined ? null : toApartment(row)
}

export function count(): number {
  return getDb().prepare('SELECT count(*) AS c FROM apartments').get()!['c'] as number
}

export function insert(apartment: Apartment): void {
  getDb()
    .prepare(`INSERT INTO apartments (${COLUMNS}) VALUES (${PLACEHOLDERS})`)
    .run(...params(apartment))
}

export function update(apartment: Apartment): void {
  getDb()
    .prepare(
      `UPDATE apartments SET
         name = ?, address = ?, floor = ?, door = ?, price = ?, minNights = ?,
         maxGuests = ?, rooms = ?, bathrooms = ?, isAvailable = ?, description = ?
       WHERE id = ?`,
    )
    .run(...params(apartment).slice(1), apartment.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM apartments WHERE id = ?').run(id)
}
