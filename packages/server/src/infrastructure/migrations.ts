import type { DatabaseSync } from 'node:sqlite'

export interface Migration {
  id: string
  sql: string
}

/**
 * Ordered, append-only list of schema migrations. Never edit an applied entry —
 * add a new one. SQL is inlined rather than read from .sql files so the bundled
 * server needs no runtime assets.
 */
export const MIGRATIONS: Migration[] = [
  {
    id: '001_initial',
    sql: `
      CREATE TABLE apartments (
        id           TEXT PRIMARY KEY,
        name         TEXT    NOT NULL,
        address      TEXT    NOT NULL,
        floor        INTEGER NOT NULL,
        door         TEXT    NOT NULL,
        price        REAL    NOT NULL,
        minNights    INTEGER NOT NULL,
        maxGuests    INTEGER NOT NULL,
        rooms        INTEGER NOT NULL,
        bathrooms    INTEGER NOT NULL,
        isAvailable  INTEGER NOT NULL CHECK (isAvailable IN (0, 1)),
        description  TEXT
      );
      CREATE UNIQUE INDEX idx_apartments_name ON apartments (lower(name));

      CREATE TABLE properties (
        id           TEXT PRIMARY KEY,
        name         TEXT    NOT NULL,
        address      TEXT    NOT NULL,
        city         TEXT,
        floor        TEXT,
        door         TEXT,
        rentalType   TEXT    NOT NULL CHECK (rentalType IN ('short-term', 'long-term', 'room')),
        isAvailable  INTEGER NOT NULL CHECK (isAvailable IN (0, 1)),
        comment      TEXT
      );
      CREATE UNIQUE INDEX idx_properties_name ON properties (lower(name));

      CREATE TABLE clients (
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
      CREATE UNIQUE INDEX idx_clients_document ON clients (upper(identityDocument));
      CREATE UNIQUE INDEX idx_clients_email    ON clients (lower(email));

      CREATE TABLE channels (
        id              TEXT PRIMARY KEY,
        name            TEXT    NOT NULL,
        commissionRate  REAL    NOT NULL,
        isActive        INTEGER NOT NULL CHECK (isActive IN (0, 1))
      );
      CREATE UNIQUE INDEX idx_channels_name ON channels (lower(name));

      CREATE TABLE bookings (
        id              TEXT PRIMARY KEY,
        apartmentId     TEXT    NOT NULL REFERENCES apartments (id) ON DELETE RESTRICT,
        clientId        TEXT    NOT NULL REFERENCES clients (id)    ON DELETE RESTRICT,
        channelId       TEXT    NOT NULL REFERENCES channels (id)   ON DELETE RESTRICT,
        fromDate        TEXT    NOT NULL,
        toDate          TEXT    NOT NULL,
        adultCount      INTEGER NOT NULL,
        childrenCount   INTEGER NOT NULL,
        cribRequested   INTEGER CHECK (cribRequested IN (0, 1)),
        status          TEXT    NOT NULL CHECK (status IN ('Active', 'Cancelled')),
        paidDate        TEXT,
        totalAmountDue  REAL    NOT NULL,
        comment         TEXT,
        createdAt       TEXT    NOT NULL
      );
      CREATE INDEX idx_bookings_apartment_dates ON bookings (apartmentId, fromDate, toDate);
      CREATE INDEX idx_bookings_client  ON bookings (clientId);
      CREATE INDEX idx_bookings_channel ON bookings (channelId);

      CREATE TABLE calendar_links (
        id           TEXT PRIMARY KEY,
        channelId    TEXT NOT NULL REFERENCES channels (id)   ON DELETE CASCADE,
        apartmentId  TEXT NOT NULL REFERENCES apartments (id) ON DELETE CASCADE,
        url          TEXT NOT NULL,
        UNIQUE (channelId, apartmentId)
      );
    `,
  },
  {
    // docs/GLOSSARY.md: one word per concept, and the industry term wins.
    // apartments -> listings, bookings -> reservations, clients -> guests.
    //
    // `properties` is dropped, not renamed: it was an inventory table nothing
    // referenced and no route wrote to after the first release. A listing is the
    // only unit this application knows (docs/GLOSSARY.md §1).
    //
    // `reservations` is rebuilt rather than renamed because its status CHECK
    // constraint has to change, and SQLite cannot alter one in place.
    id: '002_consolidate_vocabulary',
    sql: `
      DROP TABLE properties;

      ALTER TABLE apartments RENAME TO listings;
      ALTER TABLE listings RENAME COLUMN price TO nightlyRate;
      ALTER TABLE listings RENAME COLUMN isAvailable TO isActive;
      DROP INDEX idx_apartments_name;
      CREATE UNIQUE INDEX idx_listings_name ON listings (lower(name));

      ALTER TABLE clients RENAME TO guests;
      DROP INDEX idx_clients_document;
      DROP INDEX idx_clients_email;
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

      -- The old model had one live state, so a finished stay and one starting
      -- tomorrow were indistinguishable. Placing each stay by its own dates is
      -- the only reading of 'Active' that leaves the register usable: without
      -- it every past stay would land in reception's "arrival unconfirmed"
      -- queue on the morning of the upgrade.
      INSERT INTO reservations
        (id, listingId, guestId, channelId, checkIn, checkOut, adultCount,
         childrenCount, cribRequested, status, paidDate, totalAmountDue,
         comment, createdAt)
      SELECT
        id, apartmentId, clientId, channelId, fromDate, toDate, adultCount,
        childrenCount, cribRequested,
        CASE
          WHEN status = 'Cancelled'    THEN 'Cancelled'
          WHEN toDate   <= date('now') THEN 'CheckedOut'
          WHEN fromDate <= date('now') THEN 'CheckedIn'
          ELSE 'Confirmed'
        END,
        paidDate, totalAmountDue, comment, createdAt
      FROM bookings;

      DROP TABLE bookings;

      CREATE INDEX idx_reservations_listing_dates ON reservations (listingId, checkIn, checkOut);
      CREATE INDEX idx_reservations_guest   ON reservations (guestId);
      CREATE INDEX idx_reservations_channel ON reservations (channelId);
    `,
  },
]

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
}
