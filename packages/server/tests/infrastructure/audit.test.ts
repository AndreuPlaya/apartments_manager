import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { TMP_DATA_DIR } = vi.hoisted(() => {
  const os = require('node:os') as typeof import('node:os')
  const fs = require('node:fs') as typeof import('node:fs')
  const path = require('node:path') as typeof import('node:path')
  return { TMP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'apt-audit-')) }
})

vi.mock('../../src/infrastructure/paths.js', () => ({
  DATA_DIR: TMP_DATA_DIR,
  PATHS: { auditLogJsonl: join(TMP_DATA_DIR, 'config', 'audit.jsonl') },
}))

import { logAudit, type AuditEntry } from '../../src/infrastructure/audit.js'

const LOG = join(TMP_DATA_DIR, 'config', 'audit.jsonl')

const entry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  timestamp: '2026-01-01T10:00:00.000Z',
  username: 'alice',
  isAdmin: true,
  action: 'create',
  resource: 'booking',
  resourceId: 'b1',
  ...overrides,
})

function lines(): AuditEntry[] {
  return readFileSync(LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as AuditEntry)
}

beforeEach(() => {
  rmSync(join(TMP_DATA_DIR, 'config'), { recursive: true, force: true })
})

afterAll(() => {
  rmSync(TMP_DATA_DIR, { recursive: true, force: true })
})

describe('logAudit', () => {
  it('creates the log directory on first write', () => {
    expect(existsSync(LOG)).toBe(false)

    logAudit(entry())

    expect(existsSync(LOG)).toBe(true)
  })

  it('writes the entry as one JSON line', () => {
    logAudit(entry())

    expect(lines()).toEqual([entry()])
  })

  it('appends rather than overwriting', () => {
    logAudit(entry({ action: 'create', resourceId: 'b1' }))
    logAudit(entry({ action: 'update', resourceId: 'b2' }))
    logAudit(entry({ action: 'delete', resourceId: 'b3' }))

    expect(lines().map((e) => [e.action, e.resourceId])).toEqual([
      ['create', 'b1'],
      ['update', 'b2'],
      ['delete', 'b3'],
    ])
  })

  it('records entries without a resource id', () => {
    logAudit(entry({ resourceId: undefined }))

    expect(lines()[0]!.resourceId).toBeUndefined()
  })

  it('records non-admin actors', () => {
    logAudit(entry({ username: 'bob', isAdmin: false }))

    expect(lines()[0]).toMatchObject({ username: 'bob', isAdmin: false })
  })

  it('never throws when the log cannot be written', () => {
    // A directory where the log file should be makes the append fail.
    const { mkdirSync } = require('node:fs') as typeof import('node:fs')
    mkdirSync(LOG, { recursive: true })

    expect(() => logAudit(entry())).not.toThrow()
  })
})
