import { randomBytes } from 'node:crypto'
import type { AdminRecord, Settings, UserRecord } from '../domain/models.js'
import { normalizeUsername } from '../domain/validators.js'
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

/**
 * Look up an account by username, ignoring case and surrounding whitespace.
 *
 * The returned `username`/`record.username` is always the *stored* spelling,
 * never what the caller typed: it is the key into `admin_users` and what goes
 * into the JWT, so handing back the typed form would break every later lookup.
 */
export function findUser(username: string): FoundUser | null {
  const settings = loadSettings()

  // An exact key hit wins outright, so a settings.json that somehow holds both
  // `Ana` and `ana` still resolves each of them to itself.
  const exactAdmin = settings.admin_users[username]
  if (exactAdmin !== undefined) {
    return { type: 'admin', username, record: exactAdmin }
  }

  const wanted = normalizeUsername(username)

  for (const [name, record] of Object.entries(settings.admin_users)) {
    if (normalizeUsername(name) === wanted) {
      return { type: 'admin', username: name, record }
    }
  }

  for (const [id, record] of Object.entries(settings.users)) {
    if (normalizeUsername(record.username) === wanted) {
      return { type: 'user', id, record }
    }
  }

  return null
}
