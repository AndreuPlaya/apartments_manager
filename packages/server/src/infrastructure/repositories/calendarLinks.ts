import type { CalendarLink } from '../../domain/models.js'
import { getDb } from '../db.js'
import type { Row } from './mapping.js'

const COLUMNS = 'id, channelId, listingId, url'

export function toCalendarLink(row: Row): CalendarLink {
  return {
    id: row['id'] as string,
    channelId: row['channelId'] as string,
    listingId: row['listingId'] as string,
    url: row['url'] as string,
  }
}

export function list(): CalendarLink[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM calendar_links`).all().map(toCalendarLink)
}

export function findById(id: string): CalendarLink | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM calendar_links WHERE id = ?`).get(id)
  return row === undefined ? null : toCalendarLink(row)
}

export function findByChannelAndListing(channelId: string, listingId: string): CalendarLink | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM calendar_links WHERE channelId = ? AND listingId = ?`)
    .get(channelId, listingId)
  return row === undefined ? null : toCalendarLink(row)
}

export function insert(link: CalendarLink): void {
  getDb()
    .prepare(`INSERT INTO calendar_links (${COLUMNS}) VALUES (?, ?, ?, ?)`)
    .run(link.id, link.channelId, link.listingId, link.url)
}

export function updateUrl(id: string, url: string): void {
  getDb().prepare('UPDATE calendar_links SET url = ? WHERE id = ?').run(url, id)
}

export function deleteById(id: string): void {
  getDb().prepare('DELETE FROM calendar_links WHERE id = ?').run(id)
}
