import { randomBytes } from 'node:crypto'
import type { AdminRecord, Settings, UserRecord } from '../domain/models.js'
import { readJson, writeJson } from './fs.js'
import { PATHS } from './paths.js'

const DEFAULT_SETTINGS: Settings = {
  secret_key: '',
  admin_users: {},
  users: {},
}

export function loadSettings(): Settings {
  return readJson<Settings>(PATHS.settingsJson, structuredClone(DEFAULT_SETTINGS))
}

export function saveSettings(settings: Settings): void {
  writeJson(PATHS.settingsJson, settings)
}

let _cachedSecret: Uint8Array | null = null

export function ensureSecretKey(): void {
  if (process.env['JWT_SECRET']) return
  const settings = loadSettings()
  if (!settings.secret_key) {
    settings.secret_key = randomBytes(32).toString('hex')
    saveSettings(settings)
    _cachedSecret = null
  }
}

export function getSecret(): Uint8Array {
  const envSecret = process.env['JWT_SECRET']
  if (envSecret) return new TextEncoder().encode(envSecret)
  if (_cachedSecret === null) {
    _cachedSecret = new TextEncoder().encode(loadSettings().secret_key)
  }
  return _cachedSecret
}

export function isFirstRun(): boolean {
  return Object.keys(loadSettings().admin_users).length === 0
}

export type FoundUser =
  | { type: 'admin'; username: string; record: AdminRecord }
  | { type: 'user'; id: string; record: UserRecord }

export function findUser(username: string): FoundUser | null {
  const settings = loadSettings()

  const adminRecord = settings.admin_users[username]
  if (adminRecord !== undefined) {
    return { type: 'admin', username, record: adminRecord }
  }

  for (const [id, record] of Object.entries(settings.users)) {
    if (record.username === username) {
      return { type: 'user', id, record }
    }
  }

  return null
}
