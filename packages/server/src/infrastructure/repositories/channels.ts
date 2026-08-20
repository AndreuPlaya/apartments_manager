import type { Channel } from '../../domain/models.js'
import { getDb } from '../db.js'
import { toBool, toParam, type Row } from './mapping.js'

const COLUMNS = 'id, name, commissionRate, isActive'
const PLACEHOLDERS = COLUMNS.split(', ').map(() => '?').join(', ')

export function toChannel(row: Row): Channel {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    commissionRate: row['commissionRate'] as number,
    isActive: toBool(row['isActive']),
  }
}

function params(c: Channel): ReturnType<typeof toParam>[] {
  return [c.id, c.name, c.commissionRate, c.isActive].map(toParam)
}

export function list(): Channel[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM channels ORDER BY name`).all().map(toChannel)
}

export function findById(id: string): Channel | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM channels WHERE id = ?`).get(id)
  return row === undefined ? null : toChannel(row)
}

export function findByName(name: string, excludeId?: string): Channel | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM channels WHERE lower(name) = lower(?) AND id IS NOT ?`)
    .get(name, excludeId ?? null)
  return row === undefined ? null : toChannel(row)
}

export function insert(channel: Channel): void {
  getDb().prepare(`INSERT INTO channels (${COLUMNS}) VALUES (${PLACEHOLDERS})`).run(...params(channel))
}

export function update(channel: Channel): void {
  getDb()
    .prepare('UPDATE channels SET name = ?, commissionRate = ?, isActive = ? WHERE id = ?')
    .run(...params(channel).slice(1), channel.id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM channels WHERE id = ?').run(id)
}
