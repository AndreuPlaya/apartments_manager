import { existsSync, renameSync } from 'node:fs'
import type {
  Apartment,
  Booking,
  CalendarLink,
  Channel,
  Client,
  Property,
} from '../domain/models.js'
import { transaction } from './db.js'
import { readJson } from './fs.js'
import { PATHS } from './paths.js'
import * as apartments from './repositories/apartments.js'
import * as bookings from './repositories/bookings.js'
import * as calendarLinks from './repositories/calendarLinks.js'
import * as channels from './repositories/channels.js'
import * as clients from './repositories/clients.js'
import * as properties from './repositories/properties.js'

const JSON_FILES = [
  PATHS.apartmentsJson,
  PATHS.propertiesJson,
  PATHS.clientsJson,
  PATHS.channelsJson,
  PATHS.bookingsJson,
  PATHS.calendarLinksJson,
] as const

export interface ImportResult {
  imported: boolean
  counts: Record<string, number>
}

/**
 * Legacy bookings predate the Active/Cancelled status pair. This is the only
 * place that remap survives — new rows are constrained by the schema.
 *
 * Some records predate the status field entirely; those are live reservations
 * that simply never carried one, so they import as Active rather than being
 * rejected for violating NOT NULL.
 */
function readLegacyBookings(): Booking[] {
  return readJson<Record<string, unknown>[]>(PATHS.bookingsJson, []).map((b): Booking => {
    if (b['status'] === undefined || b['status'] === null || b['status'] === 'NotPaid') {
      return { ...b, status: 'Active' } as Booking
    }
    if (b['status'] === 'Paid') {
      const paidDate = (b['paidDate'] as string | undefined) ?? String(b['createdAt']).split('T')[0]
      return { ...b, status: 'Active', paidDate } as Booking
    }
    return b as unknown as Booking
  })
}

function isDatabaseEmpty(): boolean {
  return (
    apartments.list().length === 0 &&
    properties.list().length === 0 &&
    clients.list().length === 0 &&
    channels.list().length === 0 &&
    bookings.list().length === 0 &&
    calendarLinks.list().length === 0
  )
}

/**
 * One-shot import of the pre-SQLite JSON files. Runs only when JSON files exist
 * and the database is still empty, so it is safe to call on every boot.
 *
 * Any rejected record aborts the whole import (the transaction rolls back and
 * the JSON files are left untouched) with a report of every offending record,
 * rather than silently dropping data.
 */
export function importLegacyJson(): ImportResult {
  const present = JSON_FILES.filter((file) => existsSync(file))
  if (present.length === 0) return { imported: false, counts: {} }
  if (!isDatabaseEmpty()) return { imported: false, counts: {} }

  const problems: string[] = []

  function insertAll<T extends { id: string }>(
    label: string,
    rows: T[],
    insert: (row: T) => void,
    describe: (row: T) => string,
  ): number {
    for (const row of rows) {
      try {
        insert(row)
      } catch (err) {
        problems.push(`${label} ${describe(row)}: ${(err as Error).message}`)
      }
    }
    return rows.length
  }

  const counts = transaction(() => {
    const result: Record<string, number> = {}

    result['apartments'] = insertAll(
      'apartment',
      readJson<Apartment[]>(PATHS.apartmentsJson, []),
      apartments.insert,
      (a) => `${a.id} ('${a.name}')`,
    )
    result['properties'] = insertAll(
      'property',
      readJson<Property[]>(PATHS.propertiesJson, []),
      properties.insert,
      (p) => `${p.id} ('${p.name}')`,
    )
    result['clients'] = insertAll(
      'client',
      readJson<Client[]>(PATHS.clientsJson, []),
      clients.insert,
      (c) => `${c.id} ('${c.name}')`,
    )
    result['channels'] = insertAll(
      'channel',
      readJson<Channel[]>(PATHS.channelsJson, []),
      channels.insert,
      (c) => `${c.id} ('${c.name}')`,
    )
    result['bookings'] = insertAll(
      'booking',
      readLegacyBookings(),
      bookings.insert,
      (b) => `${b.id} (${b.fromDate} – ${b.toDate})`,
    )
    result['calendarLinks'] = insertAll(
      'calendar link',
      readJson<CalendarLink[]>(PATHS.calendarLinksJson, []),
      calendarLinks.insert,
      (l) => l.id,
    )

    if (problems.length > 0) {
      throw new Error(
        `Import from JSON aborted — ${problems.length} record(s) rejected. ` +
          `The database was left empty and the JSON files were not modified.\n` +
          problems.map((p) => `  - ${p}`).join('\n'),
      )
    }

    return result
  })

  // Keep the originals as a manual rollback path instead of deleting them.
  for (const file of present) renameSync(file, `${file}.migrated`)

  return { imported: true, counts }
}
