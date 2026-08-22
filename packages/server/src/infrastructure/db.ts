import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { ensureDir } from './fs.js'
import { runMigrations } from './migrations.js'
import { PATHS } from './paths.js'

// `node:sqlite` is a prefix-only builtin, so it is absent from
// `module.builtinModules` and bundlers try to resolve it from disk. Loading it
// through createRequire keeps the runtime import opaque to them; the type-only
// import above is erased at compile time.
const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')

let _db: DatabaseSync | null = null

/**
 * Opens a database, applies the connection pragmas and runs pending migrations.
 * Exported for tests, which pass ':memory:'. Production code uses `getDb()`.
 */
export function openDatabase(filePath: string): DatabaseSync {
  if (filePath !== ':memory:') ensureDir(dirname(filePath))

  const db = new sqlite.DatabaseSync(filePath)
  // WAL lets readers proceed during a write; busy_timeout absorbs the brief
  // lock contention that BEGIN IMMEDIATE can produce under concurrent writes.
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA busy_timeout = 5000')
  runMigrations(db)
  return db
}

export function getDb(): DatabaseSync {
  if (_db === null) _db = openDatabase(PATHS.dbFile)
  return _db
}

/** Installs a database as the process-wide connection. Used by tests and by boot. */
export function useDatabase(db: DatabaseSync): void {
  _db = db
}

export function closeDb(): void {
  if (_db !== null) {
    _db.close()
    _db = null
  }
}

/**
 * Runs `fn` inside an immediate transaction. BEGIN IMMEDIATE takes the write
 * lock up front, so a read-then-write sequence (such as the reservation overlap
 * check) cannot interleave with another writer.
 */
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb()
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn(db)
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
