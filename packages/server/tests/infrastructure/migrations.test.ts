import { createRequire } from 'node:module'
import type { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../src/infrastructure/db.js'
import { MIGRATIONS, runMigrations } from '../../src/infrastructure/migrations.js'

// Same reason as infrastructure/db.ts: `node:sqlite` is a prefix-only builtin,
// so a value import is resolved from disk by the bundler. These tests need a
// connection with only migration 001 applied, which openDatabase cannot give.
const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')

function names(db: DatabaseSync, type: 'table' | 'index'): string[] {
  return db
    .prepare(`SELECT name FROM sqlite_master WHERE type = ? ORDER BY name`)
    .all(type)
    .map((r) => r['name'] as string)
}

describe('runMigrations', () => {
  it('creates every table and records the migration', () => {
    const db = openDatabase(':memory:')

    expect(names(db, 'table')).toEqual([
      'calendar_links',
      'channels',
      'guests',
      'listings',
      'reservations',
      'schema_migrations',
    ])
    expect(db.prepare('SELECT id FROM schema_migrations').all().map((r) => r['id'])).toEqual(
      MIGRATIONS.map((m) => m.id),
    )
  })

  it('creates the lookup indexes', () => {
    const db = openDatabase(':memory:')

    expect(names(db, 'index').filter((n) => n.startsWith('idx_'))).toEqual([
      'idx_channels_name',
      'idx_guests_document',
      'idx_guests_email',
      'idx_listings_name',
      'idx_reservations_channel',
      'idx_reservations_guest',
      'idx_reservations_listing_dates',
    ])
  })

  it('is idempotent', () => {
    const db = openDatabase(':memory:')
    runMigrations(db)

    expect(db.prepare('SELECT count(*) AS c FROM schema_migrations').get()!['c']).toBe(
      MIGRATIONS.length,
    )
  })

  it('rolls back and reports the migration id when a migration fails', () => {
    const db = openDatabase(':memory:')
    const broken = { id: '999_broken', sql: 'CREATE TABLE ok (id TEXT); THIS IS NOT SQL;' }
    MIGRATIONS.push(broken)

    try {
      expect(() => runMigrations(db)).toThrow(/Migration '999_broken' failed/)
      expect(names(db, 'table')).not.toContain('ok')
      expect(db.prepare('SELECT id FROM schema_migrations').all().map((r) => r['id'])).not.toContain(
        '999_broken',
      )
    } finally {
      MIGRATIONS.pop()
    }
  })
})

/**
 * A database that stopped at 001 — an existing deployment, before the
 * vocabulary consolidation. Applying only the first migration by hand is the
 * only way to test 002 as an upgrade rather than as part of a fresh install.
 */
function databaseAtMigration001(): DatabaseSync {
  const db = new sqlite.DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)
  const first = MIGRATIONS[0]!
  db.exec(first.sql)
  db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
    first.id,
    '2025-01-01T00:00:00.000Z',
  )
  return db
}

function seedLegacyRows(db: DatabaseSync): void {
  db.exec(`
    INSERT INTO apartments
      (id, name, address, floor, door, price, minNights, maxGuests, rooms, bathrooms, isAvailable)
    VALUES ('apt1', 'Beach House', '1 Ocean Ave', 1, 'A', 100, 2, 4, 2, 1, 1);

    INSERT INTO properties (id, name, address, rentalType, isAvailable)
    VALUES ('p1', 'Block', '2 Main St', 'long-term', 1);

    INSERT INTO clients (id, name) VALUES ('cli1', 'Alice');
    INSERT INTO channels (id, name, commissionRate, isActive) VALUES ('ch1', 'Direct', 12, 1);

    INSERT INTO calendar_links (id, channelId, apartmentId, url)
    VALUES ('cl1', 'ch1', 'apt1', 'https://e.test/f.ics');

    INSERT INTO bookings
      (id, apartmentId, clientId, channelId, fromDate, toDate, adultCount,
       childrenCount, status, totalAmountDue, createdAt)
    VALUES
      ('past',   'apt1', 'cli1', 'ch1', '2020-01-01', '2020-01-05', 2, 0, 'Active',    400, '2020-01-01T00:00:00.000Z'),
      ('now',    'apt1', 'cli1', 'ch1', date('now', '-1 day'), date('now', '+2 day'), 2, 0, 'Active', 400, '2020-01-01T00:00:00.000Z'),
      ('future', 'apt1', 'cli1', 'ch1', '2999-01-01', '2999-01-05', 2, 0, 'Active',    400, '2020-01-01T00:00:00.000Z'),
      ('gone',   'apt1', 'cli1', 'ch1', '2020-02-01', '2020-02-05', 2, 0, 'Cancelled', 400, '2020-01-01T00:00:00.000Z');
  `)
}

describe('002_consolidate_vocabulary', () => {
  it('renames the tables and drops properties', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)

    runMigrations(db)

    const tables = names(db, 'table')
    expect(tables).toContain('listings')
    expect(tables).toContain('reservations')
    expect(tables).toContain('guests')
    expect(tables).not.toContain('apartments')
    expect(tables).not.toContain('bookings')
    expect(tables).not.toContain('clients')
    expect(tables).not.toContain('properties')
  })

  it('carries the listing across, renaming price and isAvailable', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)

    runMigrations(db)

    const row = db.prepare('SELECT name, nightlyRate, isActive FROM listings').get()!
    expect(row['name']).toBe('Beach House')
    expect(row['nightlyRate']).toBe(100)
    expect(row['isActive']).toBe(1)
  })

  it('repoints the calendar link at the listing', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)

    runMigrations(db)

    expect(db.prepare('SELECT listingId FROM calendar_links').get()!['listingId']).toBe('apt1')
  })

  it('places each live stay by its own dates', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)

    runMigrations(db)

    const byId = Object.fromEntries(
      db
        .prepare('SELECT id, status FROM reservations')
        .all()
        .map((r) => [r['id'], r['status']]),
    )
    expect(byId['past']).toBe('CheckedOut')
    expect(byId['now']).toBe('CheckedIn')
    expect(byId['future']).toBe('Confirmed')
    expect(byId['gone']).toBe('Cancelled')
  })

  it('renames the reservation columns and keeps the values', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)

    runMigrations(db)

    const row = db
      .prepare('SELECT listingId, guestId, checkIn, checkOut, totalAmountDue FROM reservations WHERE id = ?')
      .get('past')!
    expect(row['listingId']).toBe('apt1')
    expect(row['guestId']).toBe('cli1')
    expect(row['checkIn']).toBe('2020-01-01')
    expect(row['checkOut']).toBe('2020-01-05')
    expect(row['totalAmountDue']).toBe(400)
  })

  it('refuses a status outside the new lifecycle', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)
    runMigrations(db)

    expect(() =>
      db
        .prepare(
          `INSERT INTO reservations
             (id, listingId, guestId, channelId, checkIn, checkOut, adultCount,
              childrenCount, status, totalAmountDue, createdAt)
           VALUES ('x', 'apt1', 'cli1', 'ch1', '2030-01-01', '2030-01-05', 1, 0, 'Active', 1, 'now')`,
        )
        .run(),
    ).toThrow()
  })

  it('keeps the foreign keys pointing at the renamed parents', () => {
    const db = databaseAtMigration001()
    seedLegacyRows(db)
    runMigrations(db)

    expect(() => db.prepare('DELETE FROM listings WHERE id = ?').run('apt1')).toThrow()
  })
})
