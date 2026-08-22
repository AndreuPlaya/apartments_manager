import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

// getDb() falls back to PATHS.dbFile; point that at a throwaway directory so the
// test never writes into the repo.
const { TMP_DATA_DIR } = vi.hoisted(() => {
  const os = require('node:os') as typeof import('node:os')
  const fs = require('node:fs') as typeof import('node:fs')
  const path = require('node:path') as typeof import('node:path')
  return { TMP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'apt-data-')) }
})

vi.mock('../../src/infrastructure/paths.js', () => ({
  DATA_DIR: TMP_DATA_DIR,
  PATHS: { dbFile: join(TMP_DATA_DIR, 'database', 'app.db') },
}))

import { closeDb, getDb, openDatabase, transaction, useDatabase } from '../../src/infrastructure/db.js'

afterEach(() => {
  closeDb()
})

afterAll(() => {
  rmSync(TMP_DATA_DIR, { recursive: true, force: true })
})

describe('openDatabase', () => {
  it('enables foreign keys and WAL on a file-backed database', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apt-db-'))
    try {
      const db = openDatabase(join(dir, 'nested', 'app.db'))

      expect(db.prepare('PRAGMA foreign_keys').get()!['foreign_keys']).toBe(1)
      expect(db.prepare('PRAGMA journal_mode').get()!['journal_mode']).toBe('wal')
      db.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('enforces declared foreign keys', () => {
    const db = openDatabase(':memory:')

    expect(() =>
      db
        .prepare(
          `INSERT INTO calendar_links (id, channelId, listingId, url)
           VALUES ('l1', 'missing', 'missing', 'https://x.test')`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/i)
  })
})

describe('getDb', () => {
  it('returns the installed connection and reuses it', () => {
    const db = openDatabase(':memory:')
    useDatabase(db)

    expect(getDb()).toBe(db)
    expect(getDb()).toBe(db)
  })

  it('opens the configured database when none is installed', () => {
    const db = getDb()

    expect(getDb()).toBe(db)
    expect(existsSync(join(TMP_DATA_DIR, 'database', 'app.db'))).toBe(true)
  })
})

describe('transaction', () => {
  it('commits when the callback returns', () => {
    useDatabase(openDatabase(':memory:'))

    const result = transaction((db) => {
      db.prepare(`INSERT INTO channels VALUES ('c1', 'Direct', 0, 1)`).run()
      return 'done'
    })

    expect(result).toBe('done')
    expect(getDb().prepare('SELECT count(*) AS c FROM channels').get()!['c']).toBe(1)
  })

  it('rolls back and rethrows when the callback throws', () => {
    useDatabase(openDatabase(':memory:'))

    expect(() =>
      transaction((db) => {
        db.prepare(`INSERT INTO channels VALUES ('c1', 'Direct', 0, 1)`).run()
        throw new Error('boom')
      }),
    ).toThrow('boom')

    expect(getDb().prepare('SELECT count(*) AS c FROM channels').get()!['c']).toBe(0)
  })
})

describe('closeDb', () => {
  it('is a no-op when nothing is open', () => {
    closeDb()
    expect(() => closeDb()).not.toThrow()
  })
})
