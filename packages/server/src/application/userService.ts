import bcrypt from 'bcryptjs'
import { pbkdf2Sync, randomUUID, timingSafeEqual } from 'node:crypto'
import type {
  AdminRecord,
  CreateUserRequest,
  LoginRequest,
  SessionUser,
  Settings,
  UpdateUserRequest,
  UserRecord,
} from '../domain/models.js'
import {
  findUser,
  loadSettings,
  saveSettings,
} from '../infrastructure/settings.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors.js'
import { normalizeUsername } from '../domain/validators.js'

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 12

/**
 * Verify a password against a legacy Flask/werkzeug PBKDF2 hash.
 *
 * Format: `pbkdf2:<digest>:<iterations>$<salt>$<hex>`. The blueprint (§5.5)
 * requires accepting these so a migration never forces a password reset —
 * `working_hours_manager` has carried the same fallback since its own move off
 * Flask. Hashes written from here on are bcrypt.
 */
function verifyWerkzeugHash(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3) return false
  const [methodStr, salt, expected] = parts
  const methodParts = methodStr!.split(':')
  if (methodParts[0] !== 'pbkdf2' || methodParts.length < 3) return false
  const digest = methodParts[1]!
  const iterations = Number.parseInt(methodParts[2]!, 10)
  if (!Number.isFinite(iterations) || iterations <= 0) return false

  let derived: Buffer
  try {
    derived = pbkdf2Sync(password, salt!, iterations, 32, digest)
  } catch {
    // Unknown digest name — treat as a failed verification, not a crash.
    return false
  }
  const derivedBuf = Buffer.from(derived.toString('hex'))
  const expectedBuf = Buffer.from(expected!)
  if (derivedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(derivedBuf, expectedBuf)
}

export function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, SALT_ROUNDS)
}

/**
 * Check a password against whatever format the stored hash happens to be:
 * bcrypt (`$2a$`/`$2b$`/`$2y$`, all understood by bcryptjs) or legacy werkzeug
 * PBKDF2.
 */
export async function verifyPassword(raw: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2:')) return verifyWerkzeugHash(raw, stored)
  return bcrypt.compare(raw, stored)
}

export interface UserListItem {
  id: string
  username: string
  full_name: string
  email: string | undefined
  isAdmin: boolean
  enabled: boolean
}

export interface ProfileData {
  username: string
  full_name: string
  email: string | undefined
  is_admin: boolean
}

export async function getSelfProfile(user: SessionUser): Promise<ProfileData> {
  const settings = loadSettings()
  if (user.isAdmin) {
    const record = settings.admin_users[user.username]
    if (!record) throw new NotFoundError('User not found')
    return { username: user.username, full_name: record.full_name, email: record.email, is_admin: true }
  }
  const id = user.resourceId!
  const record = settings.users[id]
  if (!record) throw new NotFoundError('User not found')
  return { username: record.username, full_name: record.full_name, email: record.email, is_admin: false }
}

export async function updateSelfProfile(
  user: SessionUser,
  req: { full_name?: string; email?: string; username?: string },
): Promise<ProfileData> {
  const settings = loadSettings()
  // The same address the users screen manages, so it gets the same treatment:
  // validated, trimmed, blank means removed, and never shared with another
  // account. A setter is distinguished from an absent field before normalizing,
  // because `''` and "not mentioned" mean different things here.
  const setsEmail = req.email !== undefined
  const email = setsEmail ? normalizeEmail(req.email!) : undefined

  if (user.isAdmin) {
    const record = settings.admin_users[user.username]
    if (!record) throw new NotFoundError('User not found')
    if (email !== undefined) assertEmailFree(settings, email, user.username)
    if (req.username !== undefined && req.username !== user.username) {
      if (findUser(req.username) !== null) throw new ConflictError('Username already exists')
      const updated: AdminRecord = {
        password_hash: record.password_hash,
        full_name: req.full_name ?? record.full_name,
        email: setsEmail ? email : record.email,
        enabled: record.enabled,
      }
      delete settings.admin_users[user.username]
      settings.admin_users[req.username] = updated
      saveSettings(settings)
      return { username: req.username, full_name: updated.full_name, email: updated.email, is_admin: true }
    }
    if (req.full_name !== undefined) record.full_name = req.full_name
    if (setsEmail) record.email = email
    saveSettings(settings)
    return { username: user.username, full_name: record.full_name, email: record.email, is_admin: true }
  }
  const id = user.resourceId!
  const record = settings.users[id]
  if (!record) throw new NotFoundError('User not found')
  if (email !== undefined) assertEmailFree(settings, email, id)
  if (req.username !== undefined && req.username !== record.username) {
    if (findUser(req.username) !== null) throw new ConflictError('Username already exists')
    record.username = req.username
  }
  if (req.full_name !== undefined) record.full_name = req.full_name
  if (setsEmail) record.email = email
  saveSettings(settings)
  return { username: record.username, full_name: record.full_name, email: record.email, is_admin: false }
}

export async function changeSelfPassword(
  user: SessionUser,
  req: { current_password: string; password: string },
): Promise<void> {
  if (req.password.length < 8) throw new ValidationError('Password must be at least 8 characters')
  const settings = loadSettings()
  if (user.isAdmin) {
    const record = settings.admin_users[user.username]
    if (!record) throw new NotFoundError('User not found')
    const valid = await verifyPassword(req.current_password, record.password_hash)
    if (!valid) throw new UnauthorizedError('Current password is incorrect')
    record.password_hash = await hashPassword(req.password)
    saveSettings(settings)
    return
  }
  const id = user.resourceId!
  const record = settings.users[id]
  if (!record) throw new NotFoundError('User not found')
  const valid = await verifyPassword(req.current_password, record.password_hash)
  if (!valid) throw new UnauthorizedError('Current password is incorrect')
  record.password_hash = await hashPassword(req.password)
  saveSettings(settings)
}

export async function authenticate(req: LoginRequest): Promise<SessionUser> {
  const found = findUser(req.username)
  if (found === null) throw new UnauthorizedError('Invalid credentials')

  // `enabled` is required on a user record and optional on an admin one, so the
  // test is against `false` rather than falsiness: an admin record written
  // before the flag existed is enabled. A disabled admin used to pass this
  // check and get refused one request later by `authMiddleware`, which reads as
  // a broken session rather than as the lockout it is.
  if (found.record.enabled === false) {
    throw new UnauthorizedError('Account disabled')
  }

  // `verifyPassword`, not `bcrypt.compare`: an account carried over from the
  // Flask application still holds a werkzeug PBKDF2 hash, and comparing that as
  // bcrypt fails every time — the migration would force a password reset it was
  // written to avoid.
  const valid = await verifyPassword(req.password, found.record.password_hash)
  if (!valid) throw new UnauthorizedError('Invalid credentials')

  return {
    username: req.username,
    isAdmin: found.type === 'admin',
    resourceId: found.type === 'user' ? found.id : null,
  }
}

// ---------------------------------------------------------------------------
// Accounts
//
// `settings.json` keeps two buckets: `admin_users`, keyed by username, and
// `users`, keyed by UUID. Everything below works on one flat `Account` view of
// either, instead of branching on the bucket at every step. That is what makes
// a role change expressible at all: promoting an employee is the same account
// written to the other bucket, not a delete followed by a create that would
// lose the password nobody but its owner knows.
//
// `docs/ACCESS_LEVELS.md` §5 replaces both buckets with one collection and a
// `role` field. `Account` is the shape that survives that change — only
// `readAccount`/`writeAccount` know where the bytes actually live.
// ---------------------------------------------------------------------------

interface Account {
  /** The bucket key: the username for an admin, a UUID for an employee. */
  id: string
  isAdmin: boolean
  username: string
  password_hash: string
  full_name: string
  email: string | undefined
  enabled: boolean
}

function readAccount(settings: Settings, id: string): Account {
  const admin = settings.admin_users[id]
  if (admin !== undefined) {
    return {
      id,
      isAdmin: true,
      username: id,
      password_hash: admin.password_hash,
      full_name: admin.full_name,
      email: admin.email,
      // Optional on an admin record: absent means enabled.
      enabled: admin.enabled !== false,
    }
  }
  const user = settings.users[id]
  if (user === undefined) throw new NotFoundError(`User '${id}' not found`)
  return {
    id,
    isAdmin: false,
    username: user.username,
    password_hash: user.password_hash,
    full_name: user.full_name,
    email: user.email,
    enabled: user.enabled,
  }
}

function toListItem(account: Account): UserListItem {
  return {
    id: account.id,
    username: account.username,
    full_name: account.full_name,
    email: account.email,
    isAdmin: account.isAdmin,
    enabled: account.enabled,
  }
}

function removeAccount(settings: Settings, account: Account): void {
  if (account.isAdmin) delete settings.admin_users[account.id]
  else delete settings.users[account.id]
}

/**
 * Write `next` into the bucket its role names, first removing `previous` if the
 * account is moving — a rename changes an admin's key, and a role change
 * changes its bucket.
 */
function writeAccount(settings: Settings, next: Account, previous?: Account): void {
  if (previous !== undefined) removeAccount(settings, previous)
  if (next.isAdmin) {
    const record: AdminRecord = {
      password_hash: next.password_hash,
      full_name: next.full_name,
      email: next.email,
      enabled: next.enabled,
    }
    settings.admin_users[next.id] = record
  } else {
    const record: UserRecord = {
      username: next.username,
      password_hash: next.password_hash,
      full_name: next.full_name,
      email: next.email,
      enabled: next.enabled,
    }
    settings.users[next.id] = record
  }
}

/** Whether `account` is the caller's own. Usernames are unique across buckets. */
function isSelf(actor: SessionUser, account: Account): boolean {
  return normalizeUsername(actor.username) === normalizeUsername(account.username)
}

/**
 * How many enabled admins `settings` would hold once `previous` has become
 * `next` (`null` = deleted).
 *
 * Zero is unrecoverable: there is no support desk behind a self-hosted
 * application, and `isFirstRun()` only reopens `/setup` when the bucket is
 * *empty*, so a portfolio full of data with one disabled admin is a locked door.
 */
function enabledAdminsAfter(settings: Settings, previous: Account, next: Account | null): number {
  let count = 0
  for (const [username, record] of Object.entries(settings.admin_users)) {
    if (previous.isAdmin && username === previous.id) continue
    if (record.enabled !== false) count++
  }
  if (next !== null && next.isAdmin && next.enabled) count++
  return count
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * A blank email means "not provided", not an empty string to store — the same
 * rule `guestService` applies.
 *
 * It is validated and kept unique because it is the address a second factor
 * will be delivered to: an address that names two accounts names none.
 */
function normalizeEmail(raw: string): string | undefined {
  const email = raw.trim()
  if (email === '') return undefined
  if (!EMAIL_PATTERN.test(email)) throw new ValidationError(`'${email}' is not a valid email address`)
  return email
}

function assertEmailFree(settings: Settings, email: string, exceptId?: string): void {
  const wanted = email.toLowerCase()
  const buckets: Record<string, { email?: string }>[] = [settings.admin_users, settings.users]
  for (const bucket of buckets) {
    for (const [id, record] of Object.entries(bucket)) {
      if (id === exceptId) continue
      if (record.email !== undefined && record.email.toLowerCase() === wanted) {
        throw new ConflictError(`Email '${email}' already exists`)
      }
    }
  }
}

export function listUsers(): UserListItem[] {
  const settings = loadSettings()
  return [...Object.keys(settings.admin_users), ...Object.keys(settings.users)].map((id) =>
    toListItem(readAccount(settings, id)),
  )
}

export async function createUser(req: CreateUserRequest): Promise<UserListItem> {
  if (req.password.length < 8) throw new ValidationError('Password must be at least 8 characters')

  const username = req.username.trim()
  if (findUser(username) !== null) throw new ConflictError('Username already exists')

  const settings = loadSettings()
  const email = req.email !== undefined ? normalizeEmail(req.email) : undefined
  if (email !== undefined) assertEmailFree(settings, email)

  const account: Account = {
    id: req.isAdmin ? username : randomUUID(),
    isAdmin: req.isAdmin,
    username,
    password_hash: await hashPassword(req.password),
    full_name: req.full_name,
    email,
    enabled: true,
  }
  writeAccount(settings, account)
  saveSettings(settings)
  return toListItem(account)
}

/**
 * Apply a patch to one account: rename, rehash, re-address, enable/disable, or
 * change its role.
 *
 * The patch is merged into the whole account before anything is written, so a
 * rename can no longer drop the fields it did not mention — the old code rebuilt
 * an `AdminRecord` from `password_hash` and `full_name` alone and silently lost
 * the admin's email and disabled flag.
 *
 * `actor` is the admin making the request, needed only to refuse the two edits
 * that lock somebody out for good.
 */
export async function updateUser(
  id: string,
  req: UpdateUserRequest,
  actor: SessionUser,
): Promise<UserListItem> {
  const settings = loadSettings()
  const current = readAccount(settings, id)

  const username = req.username !== undefined ? req.username.trim() : current.username
  if (username === '') throw new ValidationError('Username is required')
  const full_name = req.full_name !== undefined ? req.full_name.trim() : current.full_name
  const isAdmin = req.isAdmin ?? current.isAdmin
  const enabled = req.enabled ?? current.enabled
  const email = req.email !== undefined ? normalizeEmail(req.email) : current.email

  // Locking yourself out is not undoable by the person it happened to, and the
  // client hides both controls on your own row — reaching here means the request
  // did not come from that screen.
  if (isSelf(actor, current)) {
    if (!enabled) throw new ForbiddenError('You cannot disable your own account')
    if (!isAdmin) throw new ForbiddenError('You cannot remove your own admin access')
  }

  if (normalizeUsername(username) !== normalizeUsername(current.username)) {
    if (findUser(username) !== null) throw new ConflictError('Username already exists')
  }

  const next: Account = {
    // An admin is keyed by username, so a rename or a promotion moves the key; a
    // demoted admin needs a UUID it never had.
    id: isAdmin ? username : current.isAdmin ? randomUUID() : current.id,
    isAdmin,
    username,
    password_hash: current.password_hash,
    full_name,
    email,
    enabled,
  }

  if (enabledAdminsAfter(settings, current, next) === 0) {
    throw new ConflictError('At least one enabled admin must remain')
  }
  if (email !== undefined) assertEmailFree(settings, email, id)
  if (req.password !== undefined && req.password !== '') {
    if (req.password.length < 8) throw new ValidationError('Password must be at least 8 characters')
    next.password_hash = await hashPassword(req.password)
  }

  writeAccount(settings, next, current)
  saveSettings(settings)
  // A role change invalidates the account's own session on its next request:
  // `authMiddleware` compares the JWT's `isAdmin` against the bucket the
  // username now lives in and refuses the mismatch, so the new reach is never
  // granted on an old claim.
  return toListItem(next)
}

/**
 * Remove an account for good.
 *
 * This used to set `enabled = false` and report success, which left the row on
 * screen as "inactive" with no way to ever remove it — the disable checkbox
 * already does that, and does it reversibly. Nothing in the database references
 * a user (reservations reference guests), and the audit log keeps the username
 * as text, so the history of what they did survives the account.
 */
export function deleteUser(id: string, actor: SessionUser): void {
  const settings = loadSettings()
  const current = readAccount(settings, id)

  if (isSelf(actor, current)) throw new ForbiddenError('You cannot delete your own account')
  if (enabledAdminsAfter(settings, current, null) === 0) {
    throw new ConflictError('At least one enabled admin must remain')
  }

  removeAccount(settings, current)
  saveSettings(settings)
}
