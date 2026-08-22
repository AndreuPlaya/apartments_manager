#!/usr/bin/env node
/**
 * One-off conversion of a v1.0.x application database to the v1.1.0 schema.
 *
 * v1.1.0 consolidated the domain vocabulary (docs/GLOSSARY.md): apartments
 * became listings, bookings became reservations, clients became guests,
 * `maxGuests` became `maxAdults`, and reservations gained the five-state
 * lifecycle (docs/RESERVATION_LIFECYCLE.md). `properties` was dropped.
 *
 * This is deliberately **not** a migration in `infrastructure/migrations.ts`.
 * Pre-launch that list holds a single editable entry describing the current
 * schema, so there is nothing there to walk an old database forward — and once
 * launched, the entry that built these databases will never exist again. A
 * standalone tool keeps the conversion reproducible and auditable without
 * pretending it is part of the schema history.
 *
 * It never writes to its input. Give it a snapshot named for the version it came
 * from and it writes a snapshot named for the version it is going to, so a
 * rollback is a file copy:
 *
 *   app.v1.0.2.db  ->  app.v1.1.0.db
 *
 * Usage:
 *   node scripts/convert-db-to-v1.1.0.mjs <in.db> <out.db> [--confirmed-only]
 *
 * Extracting the input from a running deployment: copy it with SQLite, never
 * with `cp`. WAL means a plain copy of a live database can catch a partial
 * write, and the -wal file holds commits the main file does not:
 *
 *   sqlite3 /data/database/app.db ".backup /tmp/app.v1.0.2.db"
 *
 * By default a live stay is placed by its own dates, because the old schema had
 * one live state and so could not tell a finished stay from one starting
 * tomorrow. Without this every past stay lands in reception's "arrival
 * unconfirmed" view on the morning of the upgrade. Pass --confirmed-only to
 * leave them all Confirmed instead.
 */

import { createRequire } from 'node:module'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// `node:sqlite` is a prefix-only builtin; the same createRequire indirection as
// infrastructure/db.ts keeps it opaque to bundlers.
const sqlite = createRequire(import.meta.url)('node:sqlite')

const args = process.argv.slice(2)
const confirmedOnly = args.includes('--confirmed-only')
const [input, output] = args.filter((a) => !a.startsWith('--'))

if (!input || !output) {
  console.error('Usage: node scripts/convert-db-to-v1.1.0.mjs <in.db> <out.db> [--confirmed-only]')
  process.exit(2)
}

const inPath = resolve(input)
const outPath = resolve(output)

if (!existsSync(inPath)) {
  console.error(`Input database not found: ${inPath}`)
  process.exit(1)
}
if (existsSync(outPath)) {
  console.error(`Refusing to overwrite an existing file: ${outPath}`)
  process.exit(1)
}
if (existsSync(`${inPath}-wal`)) {
  console.error(
    `${inPath}-wal exists, so this file is not a clean snapshot: it is missing\n` +
      `commits the -wal holds. Stop the container, or take the snapshot with\n` +
      `  sqlite3 <db> ".backup ${input}"`,
  )
  process.exit(1)
}

// ── Read the source, so the report can be checked against the result ─────────

const before = (() => {
  const db = new sqlite.DatabaseSync(inPath, { readOnly: true })
  const tables = new Set(
    db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .all()
      .map((r) => r.name),
  )
  if (!tables.has('bookings') || !tables.has('apartments')) {
    console.error(
      `${inPath} does not look like a v1.0.x database (no apartments/bookings tables).\n` +
        `Tables present: ${[...tables].sort().join(', ')}`,
    )
    process.exit(1)
  }
  const count = (t) => (tables.has(t) ? db.prepare(`SELECT count(*) c FROM ${t}`).get().c : null)
  const counts = {
    apartments: count('apartments'),
    clients: count('clients'),
    channels: count('channels'),
    bookings: count('bookings'),
    calendar_links: count('calendar_links'),
    properties: count('properties'),
  }
  const statuses = db.prepare('SELECT status, count(*) c FROM bookings GROUP BY status').all()
  db.close()
  return { counts, statuses }
})()

// ── Convert a copy ───────────────────────────────────────────────────────────

copyFileSync(inPath, outPath)

const db = new sqlite.DatabaseSync(outPath)
db.exec('PRAGMA foreign_keys = OFF') // renames below leave brief dangling refs

// Placing each stay by its own dates, or not. Written as SQL rather than in JS
// so the whole conversion stays one statement batch inside one transaction.
const statusExpr = confirmedOnly
  ? `CASE WHEN status = 'Cancelled' THEN 'Cancelled' ELSE 'Confirmed' END`
  : `CASE
       WHEN status = 'Cancelled'    THEN 'Cancelled'
       WHEN toDate   <= date('now') THEN 'CheckedOut'
       WHEN fromDate <= date('now') THEN 'CheckedIn'
       ELSE 'Confirmed'
     END`

db.exec('BEGIN')
try {
  db.exec(`
    DROP TABLE IF EXISTS properties;

    ALTER TABLE apartments RENAME TO listings;
    ALTER TABLE listings RENAME COLUMN price TO nightlyRate;
    ALTER TABLE listings RENAME COLUMN isAvailable TO isActive;
    -- maxGuests only ever limited adults in practice: every over-capacity stay
    -- in production was exactly maxGuests + 1 and every one of them had
    -- children. The column is renamed to say what it does.
    ALTER TABLE listings RENAME COLUMN maxGuests TO maxAdults;
    DROP INDEX IF EXISTS idx_apartments_name;
    CREATE UNIQUE INDEX idx_listings_name ON listings (lower(name));

    ALTER TABLE clients RENAME TO guests;
    DROP INDEX IF EXISTS idx_clients_document;
    DROP INDEX IF EXISTS idx_clients_email;
    CREATE UNIQUE INDEX idx_guests_document ON guests (upper(identityDocument));
    CREATE UNIQUE INDEX idx_guests_email    ON guests (lower(email));

    ALTER TABLE calendar_links RENAME COLUMN apartmentId TO listingId;

    CREATE TABLE reservations (
      id              TEXT PRIMARY KEY,
      listingId       TEXT    NOT NULL REFERENCES listings (id) ON DELETE RESTRICT,
      guestId         TEXT    NOT NULL REFERENCES guests (id)   ON DELETE RESTRICT,
      channelId       TEXT    NOT NULL REFERENCES channels (id) ON DELETE RESTRICT,
      checkIn         TEXT    NOT NULL,
      checkOut        TEXT    NOT NULL,
      adultCount      INTEGER NOT NULL,
      childrenCount   INTEGER NOT NULL,
      cribRequested   INTEGER CHECK (cribRequested IN (0, 1)),
      status          TEXT    NOT NULL CHECK (
                        status IN ('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'NoShow')
                      ),
      paidDate        TEXT,
      totalAmountDue  REAL    NOT NULL,
      comment         TEXT,
      createdAt       TEXT    NOT NULL
    );

    INSERT INTO reservations
      (id, listingId, guestId, channelId, checkIn, checkOut, adultCount,
       childrenCount, cribRequested, status, paidDate, totalAmountDue,
       comment, createdAt)
    SELECT
      id, apartmentId, clientId, channelId, fromDate, toDate, adultCount,
      childrenCount, cribRequested, ${statusExpr},
      paidDate, totalAmountDue, comment, createdAt
    FROM bookings;

    DROP TABLE bookings;

    CREATE INDEX idx_reservations_listing_dates ON reservations (listingId, checkIn, checkOut);
    CREATE INDEX idx_reservations_guest   ON reservations (guestId);
    CREATE INDEX idx_reservations_channel ON reservations (channelId);
  `)
  db.exec('COMMIT')
} catch (err) {
  db.exec('ROLLBACK')
  db.close()
  console.error(`Conversion failed, ${outPath} left mid-flight: ${err.message}`)
  process.exit(1)
}

// ── Verify before declaring success ──────────────────────────────────────────

db.exec('PRAGMA foreign_keys = ON')

const problems = []

const violations = db.prepare('PRAGMA foreign_key_check').all()
if (violations.length > 0) {
  problems.push(`${violations.length} foreign key violation(s) after conversion`)
}

const tables = new Set(
  db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .all()
    .map((r) => r.name),
)
for (const t of ['listings', 'guests', 'channels', 'reservations', 'calendar_links']) {
  if (!tables.has(t)) problems.push(`expected table ${t} is missing`)
}
for (const t of ['apartments', 'bookings', 'clients', 'properties']) {
  if (tables.has(t)) problems.push(`old table ${t} survived`)
}

const after = {
  listings: db.prepare('SELECT count(*) c FROM listings').get().c,
  guests: db.prepare('SELECT count(*) c FROM guests').get().c,
  channels: db.prepare('SELECT count(*) c FROM channels').get().c,
  reservations: db.prepare('SELECT count(*) c FROM reservations').get().c,
  calendar_links: db.prepare('SELECT count(*) c FROM calendar_links').get().c,
}

// Row counts must survive exactly. A conversion that loses a stay is worse than
// one that fails.
const parity = [
  ['listings', before.counts.apartments, after.listings],
  ['guests', before.counts.clients, after.guests],
  ['channels', before.counts.channels, after.channels],
  ['reservations', before.counts.bookings, after.reservations],
  ['calendar_links', before.counts.calendar_links, after.calendar_links],
]
for (const [name, was, now] of parity) {
  if (was !== now) problems.push(`${name}: ${was} rows in, ${now} rows out`)
}

const afterStatuses = db.prepare('SELECT status, count(*) c FROM reservations GROUP BY status').all()
const migrationsOnRecord = db
  .prepare('SELECT id FROM schema_migrations ORDER BY id')
  .all()
  .map((r) => r.id)

db.close()

// ── Report ───────────────────────────────────────────────────────────────────

const fmt = (rows) => rows.map((r) => `${r.status} ${r.c}`).join(', ')

console.log(`in   ${inPath}`)
console.log(`out  ${outPath}`)
console.log('')
console.log(`  listings        ${before.counts.apartments} -> ${after.listings}`)
console.log(`  guests          ${before.counts.clients} -> ${after.guests}`)
console.log(`  channels        ${before.counts.channels} -> ${after.channels}`)
console.log(`  reservations    ${before.counts.bookings} -> ${after.reservations}`)
console.log(`  calendar links  ${before.counts.calendar_links} -> ${after.calendar_links}`)
if (before.counts.properties !== null) {
  console.log(`  properties      ${before.counts.properties} -> dropped`)
}
console.log('')
console.log(`  status  ${fmt(before.statuses)}  ->  ${fmt(afterStatuses)}`)
console.log(`  schema_migrations on record: ${migrationsOnRecord.join(', ')}`)

if (problems.length > 0) {
  console.error('')
  console.error(`FAILED — ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  console.error('')
  console.error(`${outPath} is not fit to deploy. The input is untouched.`)
  process.exit(1)
}

console.log('')
console.log('OK. Put it in place as app.db (with no -wal/-shm siblings) and restart pms.')
