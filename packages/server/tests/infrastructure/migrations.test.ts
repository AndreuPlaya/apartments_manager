import type { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../src/infrastructure/db.js'
import { MIGRATIONS, runMigrations } from '../../src/infrastructure/migrations.js'

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
      'apartments',
      'bookings',
      'calendar_links',
      'channels',
      'clients',
      'properties',
      'schema_migrations',
    ])
    expect(db.prepare('SELECT id FROM schema_migrations').all().map((r) => r['id'])).toEqual(
      MIGRATIONS.map((m) => m.id),
    )
  })

  it('creates the lookup indexes', () => {
    const db = openDatabase(':memory:')

    expect(names(db, 'index').filter((n) => n.startsWith('idx_'))).toEqual([
      'idx_apartments_name',
      'idx_bookings_apartment_dates',
      'idx_bookings_channel',
      'idx_bookings_client',
      'idx_channels_name',
      'idx_clients_document',
      'idx_clients_email',
      'idx_properties_name',
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
