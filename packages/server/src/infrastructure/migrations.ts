import type { DatabaseSync } from 'node:sqlite'

export interface Migration {
  id: string
  sql: string
}

/**
 * Schema migrations, applied in order on the first `getDb()`.
 *
 * **Until launch there is one entry and it is editable.** No deployed database
 * exists to preserve, so a schema change belongs *in* `001_initial` rather than
 * in a migration that upgrades a database nobody has. Any developer holding a
 * stale `app.db` deletes it; that is cheaper than carrying upgrade steps for a
 * shape the application never shipped.
 *
 * **From launch onwards this list is append-only.** Once a real database exists,
 * editing an applied entry silently diverges the schema from what is recorded in
 * `schema_migrations`, and the divergence surfaces as a constraint error months
 * later. Add a new entry instead, and never touch this one again.
 *
 * The one legacy path that *is* maintained is `importJson.ts`: the JSON files
 * from the previous application are real data with real field names, and they
 * are translated at the boundary regardless of what this schema looks like.
 *
 * SQL is inlined rather than read from .sql files so the bundled server needs no
 * runtime assets.
 */
export const MIGRATIONS: Migration[] = [
  {
    id: '001_initial',
    sql: `
      CREATE TABLE listings (
        id           TEXT PRIMARY KEY,
        name         TEXT    NOT NULL,
        address      TEXT    NOT NULL,
        floor        INTEGER NOT NULL,
        door         TEXT    NOT NULL,
        nightlyRate  REAL    NOT NULL,
        minNights    INTEGER NOT NULL,
        maxAdults    INTEGER NOT NULL,
        rooms        INTEGER NOT NULL,
        bathrooms    INTEGER NOT NULL,
        isActive     INTEGER NOT NULL CHECK (isActive IN (0, 1)),
        description  TEXT
      );
      CREATE UNIQUE INDEX idx_listings_name ON listings (lower(name));

      CREATE TABLE guests (
        id                TEXT PRIMARY KEY,
        identityDocument  TEXT,
        name              TEXT NOT NULL,
        email             TEXT,
        phoneNumber       TEXT,
        street            TEXT,
        city              TEXT,
        country           TEXT,
        zipCode           TEXT,
        comment           TEXT
      );
      -- A blank document or email means "not provided", so the service maps it to
      -- NULL before insert — SQLite treats NULLs as distinct, which is what lets
      -- many guests share the absence of a document.
      CREATE UNIQUE INDEX idx_guests_document ON guests (upper(identityDocument));
      CREATE UNIQUE INDEX idx_guests_email    ON guests (lower(email));

      CREATE TABLE channels (
        id              TEXT PRIMARY KEY,
        name            TEXT    NOT NULL,
        commissionRate  REAL    NOT NULL,
        isActive        INTEGER NOT NULL CHECK (isActive IN (0, 1))
      );
      CREATE UNIQUE INDEX idx_channels_name ON channels (lower(name));

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
        -- docs/RESERVATION_LIFECYCLE.md §1. RESTRICT above rather than CASCADE:
        -- a stay outliving its listing or guest is a data-entry error to be
        -- refused, not a cleanup to be performed.
        status          TEXT    NOT NULL CHECK (
                          status IN ('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'NoShow')
                        ),
        paidDate        TEXT,
        totalAmountDue  REAL    NOT NULL,
        comment         TEXT,
        createdAt       TEXT    NOT NULL
      );
      CREATE INDEX idx_reservations_listing_dates ON reservations (listingId, checkIn, checkOut);
      CREATE INDEX idx_reservations_guest   ON reservations (guestId);
      CREATE INDEX idx_reservations_channel ON reservations (channelId);

      CREATE TABLE calendar_links (
        id         TEXT PRIMARY KEY,
        channelId  TEXT NOT NULL REFERENCES channels (id) ON DELETE CASCADE,
        listingId  TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
        url        TEXT NOT NULL,
        -- CASCADE here, unlike reservations: a sync URL carries no history worth
        -- protecting once the thing it synced is gone.
        UNIQUE (channelId, listingId)
      );
    `,
  },
]

/**
 * Tables every migration in the list above is expected to have created.
 *
 * A database that recorded `001_initial` under an *earlier* definition of it
 * skips the migration and then fails on every query — and it fails late, one
 * request at a time, with `no such table`. While the list is editable
 * (see MIGRATIONS) that is a real possibility, so the mismatch is turned into a
 * refusal to start: a container that will not boot is a signal, a container that
 * boots and 500s on everything is not.
 *
 * Once the list is append-only this check costs one query and never fires.
 */
const EXPECTED_TABLES = [
  'calendar_links',
  'channels',
  'guests',
  'listings',
  'reservations',
] as const

function assertSchemaIsCurrent(db: DatabaseSync): void {
  const present = new Set(
    db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .all()
      .map((row) => row['name'] as string),
  )
  const missing = EXPECTED_TABLES.filter((t) => !present.has(t))
  if (missing.length === 0) return

  throw new Error(
    `Database schema is out of date: missing table(s) ${missing.join(', ')}.\n` +
      `Every migration is recorded as applied, so nothing will fix this on its own.\n` +
      `Before launch the answer is to start over: delete the database file (and its\n` +
      `-wal/-shm siblings), rename any *.json.migrated back to *.json, and restart —\n` +
      `the legacy import will repopulate it. See docs/DOMAIN.md section 8.`,
  )
}

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((row) => row['id'] as string),
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue

    db.exec('BEGIN')
    try {
      db.exec(migration.sql)
      db
        .prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)')
        .run(migration.id, new Date().toISOString())
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw new Error(`Migration '${migration.id}' failed: ${(err as Error).message}`, { cause: err })
    }
  }

  assertSchemaIsCurrent(db)
}
