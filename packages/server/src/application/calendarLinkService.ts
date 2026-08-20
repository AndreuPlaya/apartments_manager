import { randomUUID } from 'node:crypto'
import type { CalendarLink, CreateCalendarLinkRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as calendarLinks from '../infrastructure/repositories/calendarLinks.js'
import { NotFoundError, ValidationError } from './errors.js'

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'webcal:'])

function validateCalendarUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new ValidationError('Invalid URL format')
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new ValidationError(`URL protocol must be http, https, or webcal`)
  }
}

export function listCalendarLinks(): CalendarLink[] {
  return calendarLinks.list()
}

export function upsertCalendarLink(req: CreateCalendarLinkRequest): CalendarLink {
  validateCalendarUrl(req.url)

  return transaction(() => {
    const existing = calendarLinks.findByChannelAndApartment(req.channelId, req.apartmentId)

    if (existing !== null) {
      calendarLinks.updateUrl(existing.id, req.url)
      return { ...existing, url: req.url }
    }

    const link: CalendarLink = { id: randomUUID(), ...req }
    calendarLinks.insert(link)
    return link
  })
}

export function deleteCalendarLink(id: string): void {
  transaction(() => {
    if (calendarLinks.findById(id) === null) throw new NotFoundError(`Calendar link '${id}' not found`)
    calendarLinks.deleteById(id)
  })
}
