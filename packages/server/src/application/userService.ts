import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import type {
  AdminRecord,
  CreateUserRequest,
  LoginRequest,
  SessionUser,
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

export interface UserListItem {
  id: string
  username: string
  full_name: string
  isAdmin: boolean
  enabled: boolean
}

export async function authenticate(req: LoginRequest): Promise<SessionUser> {
  const found = findUser(req.username)
  if (found === null) throw new UnauthorizedError('Invalid credentials')

  if (found.type === 'user' && !found.record.enabled) {
    throw new UnauthorizedError('Account disabled')
  }

  const hash = found.record.password_hash
  const valid = await bcrypt.compare(req.password, hash)
  if (!valid) throw new UnauthorizedError('Invalid credentials')

  return {
    username: req.username,
    isAdmin: found.type === 'admin',
    resourceId: found.type === 'user' ? found.id : null,
  }
}

export function listUsers(): UserListItem[] {
  const settings = loadSettings()
  const items: UserListItem[] = []

  for (const [username, record] of Object.entries(settings.admin_users)) {
    items.push({ id: username, username, full_name: record.full_name, isAdmin: true, enabled: true })
  }

  for (const [id, record] of Object.entries(settings.users)) {
    items.push({
      id,
      username: record.username,
      full_name: record.full_name,
      isAdmin: false,
      enabled: record.enabled,
    })
  }

  return items
}

export async function createUser(req: CreateUserRequest): Promise<UserListItem> {
  if (req.password.length < 8) throw new ValidationError('Password must be at least 8 characters')

  const existing = findUser(req.username)
  if (existing !== null) throw new ConflictError(`Username '${req.username}' already exists`)

  const password_hash = await bcrypt.hash(req.password, 12)
  const settings = loadSettings()

  if (req.isAdmin) {
    const record: AdminRecord = { password_hash, full_name: req.full_name }
    settings.admin_users[req.username] = record
    saveSettings(settings)
    return { id: req.username, username: req.username, full_name: req.full_name, isAdmin: true, enabled: true }
  } else {
    const id = randomUUID()
    const record: UserRecord = {
      username: req.username,
      password_hash,
      full_name: req.full_name,
      enabled: true,
    }
    settings.users[id] = record
    saveSettings(settings)
    return { id, username: req.username, full_name: req.full_name, isAdmin: false, enabled: true }
  }
}

export async function updateUser(id: string, req: UpdateUserRequest): Promise<UserListItem> {
  const settings = loadSettings()

  // Check if it's an admin (id = username for admins)
  const adminRecord = settings.admin_users[id]
  if (adminRecord !== undefined) {
    if (req.username !== undefined && req.username !== id) {
      // Renaming admin — check for conflicts
      if (findUser(req.username) !== null) throw new ConflictError(`Username '${req.username}' already exists`)
      const updatedRecord: AdminRecord = {
        password_hash: req.password ? await bcrypt.hash(req.password, 12) : adminRecord.password_hash,
        full_name: req.full_name ?? adminRecord.full_name,
      }
      delete settings.admin_users[id]
      settings.admin_users[req.username] = updatedRecord
      saveSettings(settings)
      return { id: req.username, username: req.username, full_name: updatedRecord.full_name, isAdmin: true, enabled: true }
    }
    if (req.password) adminRecord.password_hash = await bcrypt.hash(req.password, 12)
    if (req.full_name !== undefined) adminRecord.full_name = req.full_name
    saveSettings(settings)
    return { id, username: id, full_name: adminRecord.full_name, isAdmin: true, enabled: true }
  }

  // Regular user (id = UUID key)
  const record = settings.users[id]
  if (record === undefined) throw new NotFoundError(`User '${id}' not found`)

  if (req.username !== undefined && req.username !== record.username) {
    if (findUser(req.username) !== null) throw new ConflictError(`Username '${req.username}' already exists`)
    record.username = req.username
  }
  if (req.password) record.password_hash = await bcrypt.hash(req.password, 12)
  if (req.full_name !== undefined) record.full_name = req.full_name
  if (req.enabled !== undefined) record.enabled = req.enabled

  saveSettings(settings)
  return { id, username: record.username, full_name: record.full_name, isAdmin: false, enabled: record.enabled }
}

export function deleteUser(id: string): void {
  const settings = loadSettings()

  // Prevent deleting admins via this route
  if (settings.admin_users[id] !== undefined) {
    throw new ForbiddenError('Cannot delete admin accounts via this route')
  }

  const record = settings.users[id]
  if (record === undefined) throw new NotFoundError(`User '${id}' not found`)

  record.enabled = false
  saveSettings(settings)
}
