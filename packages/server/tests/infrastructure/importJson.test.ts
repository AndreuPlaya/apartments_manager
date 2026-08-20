import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { TMP_DATA_DIR } = vi.hoisted(() => {
  const os = require('node:os') as typeof import('node:os')
  const fs = require('node:fs') as typeof import('node:fs')
  const path = require('node:path') as typeof import('node:path')
  return { TMP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'apt-import-')) }
})

vi.mock('../../src/infrastructure/paths.js', () => ({
  DATA_DIR: TMP_DATA_DIR,
  PATHS: {
    dbFile: join(TMP_DATA_DIR, 'database', 'app.db'),
    apartmentsJson: join(TMP_DATA_DIR, 'database', 'apartments.json'),
    propertiesJson: join(TMP_DATA_DIR, 'database', 'properties.json'),
    bookingsJson: join(TMP_DATA_DIR, 'database', 'bookings.json'),
    clientsJson: join(TMP_DATA_DIR, 'database', 'clients.json'),
    channelsJson: join(TMP_DATA_DIR, 'database', 'channels.json'),
    calendarLinksJson: join(TMP_DATA_DIR, 'database', 'calendarLinks.json'),
  },
}))

import { closeDb, openDatabase, useDatabase } from '../../src/infrastructure/db.js'
import { importLegacyJson } from '../../src/infrastructure/importJson.js'
import * as apartmentsRepo from '../../src/infrastructure/repositories/apartments.js'
import * as bookingsRepo from '../../src/infrastructure/repositories/bookings.js'
import * as calendarLinksRepo from '../../src/infrastructure/repositories/calendarLinks.js'
import * as channelsRepo from '../../src/infrastructure/repositories/channels.js'
import * as clientsRepo from '../../src/infrastructure/repositories/clients.js'
import * as propertiesRepo from '../../src/infrastructure/repositories/properties.js'

let dir: string

function write(file: string, data: unknown): void {
  writeFileSync(join(dir, 'database', `${file}.json`), JSON.stringify(data), 'utf8')
}

const APARTMENT = {
  id: 'apt1', name: 'Beach House', address: '1 Ocean Ave', floor: 1, door: 'A',
  price: 100, minNights: 2, maxGuests: 4, rooms: 2, bathrooms: 1, isAvailable: true,
}
const CLIENT = { id: 'cli1', name: 'Alice', email: 'alice@example.com' }
const CHANNEL = { id: 'ch1', name: 'Direct', commissionRate: 0, isActive: true }
const BOOKING = {
  id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
  fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 2, childrenCount: 0,
  status: 'Active', totalAmountDue: 400, createdAt: '2025-01-01T10:00:00.000Z',
}

beforeEach(() => {
  dir = TMP_DATA_DIR
  rmSync(join(dir, 'database'), { recursive: true, force: true })
  mkdirSync(join(dir, 'database'), { recursive: true })
  useDatabase(openDatabase(':memory:'))
})

afterEach(() => {
  closeDb()
})

afterAll(() => {
  rmSync(TMP_DATA_DIR, { recursive: true, force: true })
})

describe('importLegacyJson', () => {
  it('does nothing when no JSON files are present', () => {
    expect(importLegacyJson()).toEqual({ imported: false, counts: {} })
  })

  it('imports every entity and renames the source files', () => {
    write('apartments', [APARTMENT])
    write('properties', [
      { id: 'p1', name: 'Block', address: '2 Main St', rentalType: 'long-term', isAvailable: true },
    ])
    write('clients', [CLIENT])
    write('channels', [CHANNEL])
    write('bookings', [BOOKING])
    write('calendarLinks', [
      { id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://e.test/f.ics' },
    ])

    const result = importLegacyJson()

    expect(result.imported).toBe(true)
    expect(result.counts).toEqual({
      apartments: 1, properties: 1, clients: 1, channels: 1, bookings: 1, calendarLinks: 1,
    })
    expect(apartmentsRepo.list()).toEqual([APARTMENT])
    expect(clientsRepo.list()[0]!.email).toBe('alice@example.com')
    expect(channelsRepo.list()).toEqual([CHANNEL])
    expect(propertiesRepo.list()).toHaveLength(1)
    expect(bookingsRepo.list()).toEqual([BOOKING])
    expect(calendarLinksRepo.list()).toHaveLength(1)

    expect(existsSync(join(dir, 'database', 'bookings.json'))).toBe(false)
    expect(existsSync(join(dir, 'database', 'bookings.json.migrated'))).toBe(true)
  })

  it('remaps the legacy NotPaid and Paid statuses', () => {
    write('apartments', [APARTMENT])
    write('clients', [CLIENT])
    write('channels', [CHANNEL])
    write('bookings', [
      { ...BOOKING, id: 'b1', status: 'NotPaid' },
      { ...BOOKING, id: 'b2', fromDate: '2025-07-01', toDate: '2025-07-05', status: 'Paid' },
      {
        ...BOOKING, id: 'b3', fromDate: '2025-08-01', toDate: '2025-08-05',
        status: 'Paid', paidDate: '2025-07-30',
      },
    ])

    importLegacyJson()

    const [b1, b2, b3] = bookingsRepo.list()
    expect(b1).toMatchObject({ id: 'b1', status: 'Active', paidDate: undefined })
    // Paid without paidDate falls back to the creation day.
    expect(b2).toMatchObject({ id: 'b2', status: 'Active', paidDate: '2025-01-01' })
    expect(b3).toMatchObject({ id: 'b3', status: 'Active', paidDate: '2025-07-30' })
  })

  it('imports bookings that predate the status field as Active', () => {
    write('apartments', [APARTMENT])
    write('clients', [CLIENT])
    write('channels', [CHANNEL])
    const { status, ...withoutStatus } = BOOKING
    write('bookings', [withoutStatus, { ...BOOKING, id: 'b2', fromDate: '2025-07-01', toDate: '2025-07-05', status: null }])

    const result = importLegacyJson()

    expect(result.counts['bookings']).toBe(2)
    expect(bookingsRepo.list().map((b) => b.status)).toEqual(['Active', 'Active'])
  })

  it('skips when the database already holds data', () => {
    apartmentsRepo.insert(APARTMENT)
    write('apartments', [{ ...APARTMENT, id: 'apt2', name: 'Villa' }])

    expect(importLegacyJson()).toEqual({ imported: false, counts: {} })
    expect(apartmentsRepo.list()).toHaveLength(1)
    expect(existsSync(join(dir, 'database', 'apartments.json'))).toBe(true)
  })

  it('aborts, rolls back and keeps the JSON when a booking references a missing client', () => {
    write('apartments', [APARTMENT])
    write('channels', [CHANNEL])
    write('bookings', [BOOKING])

    expect(() => importLegacyJson()).toThrow(/1 record\(s\) rejected/)
    expect(bookingsRepo.list()).toEqual([])
    expect(apartmentsRepo.list()).toEqual([])
    expect(existsSync(join(dir, 'database', 'bookings.json'))).toBe(true)
  })

  it('reports every offending record, not just the first', () => {
    write('clients', [CLIENT, { id: 'cli2', name: 'Bob', email: 'ALICE@example.com' }])
    write('channels', [CHANNEL, { ...CHANNEL, id: 'ch2', name: 'direct' }])

    expect(() => importLegacyJson()).toThrow(/2 record\(s\) rejected/)
  })

  it('names the offending record in the report', () => {
    write('apartments', [APARTMENT, { ...APARTMENT, id: 'apt2', name: 'beach house' }])

    expect(() => importLegacyJson()).toThrow(/apartment apt2 \('beach house'\)/)
  })
})
