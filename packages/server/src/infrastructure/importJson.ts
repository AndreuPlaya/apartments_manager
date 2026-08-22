import { existsSync, renameSync } from 'node:fs'
import type {
  Listing,
  Reservation,
  CalendarLink,
  Channel,
  Guest,
} from '../domain/models.js'
import { transaction } from './db.js'
import { readJson } from './fs.js'
import { PATHS } from './paths.js'
import * as listings from './repositories/listings.js'
import * as reservations from './repositories/reservations.js'
import * as calendarLinks from './repositories/calendarLinks.js'
import * as channels from './repositories/channels.js'
import * as guests from './repositories/guests.js'

const JSON_FILES = [
  PATHS.apartmentsJson,
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
 * The legacy JSON files speak the pre-consolidation vocabulary: `apartmentId`,
 * `clientId`, `fromDate`, `toDate`, `price`, `isAvailable`. They are input from
 * an application we no longer control, so their field names are not ours to
 * rename — every legacy row is translated here into the canonical shape
 * (docs/GLOSSARY.md §2) and nowhere else.
 */
type LegacyRow = Record<string, unknown>

function str(row: LegacyRow, key: string): string {
  return row[key] as string
}

function readLegacyListings(): Listing[] {
  return readJson<LegacyRow[]>(PATHS.apartmentsJson, []).map((a) => {
    const { price, isAvailable, ...rest } = a
    return { ...rest, nightlyRate: price, isActive: isAvailable } as unknown as Listing
  })
}

function readLegacyCalendarLinks(): CalendarLink[] {
  return readJson<LegacyRow[]>(PATHS.calendarLinksJson, []).map((l) => {
    const { apartmentId, ...rest } = l
    return { ...rest, listingId: apartmentId } as unknown as CalendarLink
  })
}

/**
 * Legacy reservations predate the current lifecycle. `Active`, `Paid` and
 * `NotPaid` all described a live stay, so all three become `Confirmed` and the
 * lifecycle takes over from there; `Paid` additionally carried its payment date
 * in the status rather than in a field.
 *
 * Records that predate the status field entirely are live stays that simply
 * never carried one, so they import as `Confirmed` rather than being rejected
 * for violating NOT NULL.
 *
 * Unlike migration 002, this does not place a stay by its dates: these files
 * come from an app that never tracked arrivals, so there is no arrival to
 * preserve. Reception confirms them, which is rule L8 working as intended.
 */
function readLegacyReservations(): Reservation[] {
  return readJson<LegacyRow[]>(PATHS.bookingsJson, []).map((b): Reservation => {
    const { apartmentId, clientId, fromDate, toDate, status, ...rest } = b
    const base = {
      ...rest,
      listingId: apartmentId,
      guestId: clientId,
      checkIn: fromDate,
      checkOut: toDate,
    }

    if (status === undefined || status === null || status === 'NotPaid' || status === 'Active') {
      return { ...base, status: 'Confirmed' } as unknown as Reservation
    }
    if (status === 'Paid') {
      const paidDate = (b['paidDate'] as string | undefined) ?? str(b, 'createdAt').split('T')[0]
      return { ...base, status: 'Confirmed', paidDate } as unknown as Reservation
    }
    return { ...base, status } as unknown as Reservation
  })
}

function isDatabaseEmpty(): boolean {
  return (
    listings.list().length === 0 &&
    guests.list().length === 0 &&
    channels.list().length === 0 &&
    reservations.list().length === 0 &&
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

    result['listings'] = insertAll(
      'listing',
      readLegacyListings(),
      listings.insert,
      (a) => `${a.id} ('${a.name}')`,
    )
    result['guests'] = insertAll(
      'guest',
      readJson<Guest[]>(PATHS.clientsJson, []),
      guests.insert,
      (c) => `${c.id} ('${c.name}')`,
    )
    result['channels'] = insertAll(
      'channel',
      readJson<Channel[]>(PATHS.channelsJson, []),
      channels.insert,
      (c) => `${c.id} ('${c.name}')`,
    )
    result['reservations'] = insertAll(
      'reservation',
      readLegacyReservations(),
      reservations.insert,
      (b) => `${b.id} (${b.checkIn} – ${b.checkOut})`,
    )
    result['calendarLinks'] = insertAll(
      'calendar link',
      readLegacyCalendarLinks(),
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
