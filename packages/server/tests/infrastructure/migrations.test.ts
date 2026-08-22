import { createRequire } from 'node:module'
import type { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../src/infrastructure/db.js'
import { MIGRATIONS, runMigrations } from '../../src/infrastructure/migrations.js'

// Same reason as infrastructure/db.ts: `node:sqlite` is a prefix-only builtin,
// so a value import gets resolved from disk by the bundler. These tests need a
// raw connection, which openDatabase cannot hand out.
const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')

function names(db: DatabaseSync, type: 'table' | 'index'): string[] {
  return db
    .prepare(`SELECT name FROM sqlite_master WHERE type = ? ORDER BY name`)
    .all(type)
    .map((r) => r['name'] as string)
}

function seedBase(db: DatabaseSync): void {
  db.exec(`
    INSERT INTO listings
      (id, name, address, floor, door, nightlyRate, minNights, maxAdults, rooms, bathrooms, isActive)
    VALUES ('l1', 'Beach House', '1 Ocean Ave', 1, 'A', 100, 2, 4, 2, 1, 1);

    INSERT INTO guests (id, name) VALUES ('g1', 'Alice');
    INSERT INTO channels (id, name, commissionRate, isActive) VALUES ('ch1', 'Direct', 12, 1);
  `)
}

function insertReservation(db: DatabaseSync, status: string): void {
  db.prepare(
    `INSERT INTO reservations
       (id, listingId, guestId, channelId, checkIn, checkOut, adultCount,
        childrenCount, status, totalAmountDue, createdAt)
     VALUES ('r1', 'l1', 'g1', 'ch1', '2030-01-01', '2030-01-05', 2, 0, ?, 400, 'now')`,
  ).run(status)
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

describe('the stale-database guard', () => {
  it('refuses to start when a recorded migration left the schema behind', () => {
    // The shape a pre-launch edit of 001_initial leaves behind: the id is on
    // record, so nothing will re-run, and every query would fail one at a time.
    const db = new sqlite.DatabaseSync(':memory:')
    db.exec(`
      CREATE TABLE schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations (id, applied_at) VALUES ('001_initial', 'then');
      CREATE TABLE apartments (id TEXT PRIMARY KEY);
    `)

    expect(() => runMigrations(db)).toThrow(/schema is out of date/)
  })

  it('names every missing table and how to recover', () => {
    const db = new sqlite.DatabaseSync(':memory:')
    db.exec(`
      CREATE TABLE schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations (id, applied_at) VALUES ('001_initial', 'then');
    `)

    expect(() => runMigrations(db)).toThrow(/listings/)
    expect(() => runMigrations(db)).toThrow(/reservations/)
    expect(() => runMigrations(db)).toThrow(/json\.migrated/)
  })

  it('passes silently on a database the migrations actually built', () => {
    expect(() => openDatabase(':memory:')).not.toThrow()
  })
})

/**
 * The schema carries the invariants the services are allowed to assume, so each
 * one is asserted here rather than trusted. If a service ever has to re-check
 * one of these, the schema has stopped doing its job.
 */
describe('schema invariants', () => {
  it('accepts every lifecycle status', () => {
    const db = openDatabase(':memory:')
    seedBase(db)

    for (const status of ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'NoShow']) {
      db.exec('DELETE FROM reservations')
      expect(() => insertReservation(db, status)).not.toThrow()
    }
  })

  it('refuses a status outside the lifecycle', () => {
    const db = openDatabase(':memory:')
    seedBase(db)

    expect(() => insertReservation(db, 'Active')).toThrow()
  })

  it('holds listing, guest and channel names unique case-insensitively', () => {
    const db = openDatabase(':memory:')
    seedBase(db)

    expect(() =>
      db.exec(`INSERT INTO listings
                 (id, name, address, floor, door, nightlyRate, minNights, maxAdults, rooms, bathrooms, isActive)
               VALUES ('l2', 'beach house', '2 Ocean Ave', 2, 'B', 90, 1, 2, 1, 1, 1)`),
    ).toThrow()
    expect(() =>
      db.exec(`INSERT INTO channels (id, name, commissionRate, isActive)
               VALUES ('ch2', 'direct', 0, 1)`),
    ).toThrow()
  })

  it('lets many guests share the absence of a document or email', () => {
    const db = openDatabase(':memory:')

    expect(() =>
      db.exec(`INSERT INTO guests (id, name) VALUES ('g1', 'Alice'), ('g2', 'Bob')`),
    ).not.toThrow()
  })

  it('restricts deleting a listing, guest or channel that a reservation references', () => {
    const db = openDatabase(':memory:')
    seedBase(db)
    insertReservation(db, 'Confirmed')

    expect(() => db.prepare('DELETE FROM listings WHERE id = ?').run('l1')).toThrow()
    expect(() => db.prepare('DELETE FROM guests WHERE id = ?').run('g1')).toThrow()
    expect(() => db.prepare('DELETE FROM channels WHERE id = ?').run('ch1')).toThrow()
  })

  it('cascades calendar links away with their listing', () => {
    const db = openDatabase(':memory:')
    seedBase(db)
    db.exec(`INSERT INTO calendar_links (id, channelId, listingId, url)
             VALUES ('cl1', 'ch1', 'l1', 'https://e.test/f.ics')`)

    db.prepare('DELETE FROM listings WHERE id = ?').run('l1')

    expect(db.prepare('SELECT count(*) AS c FROM calendar_links').get()!['c']).toBe(0)
  })

  it('holds one calendar link per channel and listing', () => {
    const db = openDatabase(':memory:')
    seedBase(db)
    db.exec(`INSERT INTO calendar_links (id, channelId, listingId, url)
             VALUES ('cl1', 'ch1', 'l1', 'https://e.test/f.ics')`)

    expect(() =>
      db.exec(`INSERT INTO calendar_links (id, channelId, listingId, url)
               VALUES ('cl2', 'ch1', 'l1', 'https://e.test/other.ics')`),
    ).toThrow()
  })
})
