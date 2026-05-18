import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Settings } from '../domain/models.js'

vi.mock('./fs.js')
import { readJson, writeJson } from './fs.js'

import {
  ensureSecretKey,
  findUser,
  getSecret,
  isFirstRun,
  loadSettings,
  saveSettings,
} from './settings.js'

const baseSettings: Settings = {
  secret_key: 'existing-key',
  admin_users: {
    admin: { password_hash: 'hash', full_name: 'Admin' },
  },
  users: {
    'uuid-1': { username: 'alice', password_hash: 'hash2', full_name: 'Alice', enabled: true },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readJson).mockReturnValue(structuredClone(baseSettings))
  vi.mocked(writeJson).mockImplementation(() => undefined)
})

describe('loadSettings', () => {
  it('returns parsed settings from readJson', () => {
    const result = loadSettings()
    expect(result.secret_key).toBe('existing-key')
    expect(readJson).toHaveBeenCalledOnce()
  })
})

describe('saveSettings', () => {
  it('writes settings via writeJson', () => {
    saveSettings(baseSettings)
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('ensureSecretKey', () => {
  it('returns existing key without saving when already set', () => {
    const key = ensureSecretKey()
    expect(key).toBe('existing-key')
    expect(writeJson).not.toHaveBeenCalled()
  })

  it('generates and saves a new key when secret_key is empty', () => {
    vi.mocked(readJson).mockReturnValue({ ...baseSettings, secret_key: '' })
    const key = ensureSecretKey()
    expect(key).toHaveLength(64) // 32 bytes hex
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('getSecret', () => {
  it('returns a Uint8Array encoded from the secret_key', () => {
    const secret = getSecret()
    expect(secret).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(secret)).toBe('existing-key')
  })
})

describe('isFirstRun', () => {
  it('returns false when admin_users is non-empty', () => {
    expect(isFirstRun()).toBe(false)
  })

  it('returns true when admin_users is empty', () => {
    vi.mocked(readJson).mockReturnValue({ ...baseSettings, admin_users: {} })
    expect(isFirstRun()).toBe(true)
  })
})

describe('findUser', () => {
  it('returns admin record for an admin username', () => {
    const result = findUser('admin')
    expect(result?.type).toBe('admin')
    if (result?.type === 'admin') {
      expect(result.username).toBe('admin')
      expect(result.record.full_name).toBe('Admin')
    }
  })

  it('returns user record for a regular username', () => {
    const result = findUser('alice')
    expect(result?.type).toBe('user')
    if (result?.type === 'user') {
      expect(result.id).toBe('uuid-1')
      expect(result.record.username).toBe('alice')
    }
  })

  it('returns null for unknown username', () => {
    expect(findUser('nobody')).toBeNull()
  })
})
