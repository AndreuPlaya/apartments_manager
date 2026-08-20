import type { Property } from '../../domain/models.js'
import { getDb } from '../db.js'
import { opt, toBool, toParam, type Row } from './mapping.js'

const COLUMNS = 'id, name, address, city, floor, door, rentalType, isAvailable, comment'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toProperty(row: Row): Property {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    address: row['address'] as string,
    city: opt<string>(row['city']),
    floor: opt<string>(row['floor']),
    door: opt<string>(row['door']),
    rentalType: row['rentalType'] as Property['rentalType'],
    isAvailable: toBool(row['isAvailable']),
    comment: opt<string>(row['comment']),
  }
}

function params(p: Property): ReturnType<typeof toParam>[] {
  return [
    p.id, p.name, p.address, p.city, p.floor, p.door,
    p.rentalType, p.isAvailable, p.comment,
  ].map(toParam)
}

export function list(): Property[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM properties ORDER BY name`).all().map(toProperty)
}

export function findById(id: string): Property | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM properties WHERE id = ?`).get(id)
  return row === undefined ? null : toProperty(row)
}

export function findByName(name: string, excludeId?: string): Property | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM properties WHERE lower(name) = lower(?) AND id IS NOT ?`)
    .get(name, excludeId ?? null)
  return row === undefined ? null : toProperty(row)
}

export function insert(property: Property): void {
  getDb().prepare(`INSERT INTO properties (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(property))
}

export function update(property: Property): void {
  getDb()
    .prepare(
      `UPDATE properties SET
         name = ?, address = ?, city = ?, floor = ?, door = ?,
         rentalType = ?, isAvailable = ?, comment = ?
       WHERE id = ?`,
    )
    .run(...params(property).slice(1), property.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM properties WHERE id = ?').run(id)
}
