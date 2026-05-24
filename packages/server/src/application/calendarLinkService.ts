import { randomUUID } from 'node:crypto'
import type { CalendarLink, CreateCalendarLinkRequest } from '../domain/models.js'
import { loadCalendarLinks, saveCalendarLinks } from '../infrastructure/data.js'
import { NotFoundError } from './errors.js'

export function listCalendarLinks(): CalendarLink[] {
  return loadCalendarLinks()
}

export function upsertCalendarLink(req: CreateCalendarLinkRequest): CalendarLink {
  const all = loadCalendarLinks()
  const existing = all.find(
    (l) => l.channelId === req.channelId && l.apartmentId === req.apartmentId,
  )

  if (existing) {
    const updated: CalendarLink = { ...existing, url: req.url }
    const idx = all.findIndex((l) => l.id === existing.id)
    all[idx] = updated
    saveCalendarLinks(all)
    return updated
  }

  const link: CalendarLink = { id: randomUUID(), ...req }
  saveCalendarLinks([...all, link])
  return link
}

export function deleteCalendarLink(id: string): void {
  const all = loadCalendarLinks()
  const idx = all.findIndex((l) => l.id === id)
  if (idx === -1) throw new NotFoundError(`Calendar link '${id}' not found`)
  saveCalendarLinks(all.filter((l) => l.id !== id))
}
