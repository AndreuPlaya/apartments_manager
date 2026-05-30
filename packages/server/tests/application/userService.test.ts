import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Settings } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/settings.js')
import {
  findUser,
  loadSettings,
  saveSettings,
} from '../../src/infrastructure/settings.js'

import { authenticate, createUser, deleteUser, listUsers, updateUser } from '../../src/application/userService.js'

// Pre-compute a real bcrypt hash for 'password123' (4 rounds = fast in tests)
const adminPasswordHash = bcrypt.hashSync('password123', 4)

const mockSettings: Settings = {
  secret_key: 'abc',
  admin_users: {
    admin: {
      password_hash: adminPasswordHash,
      full_name: 'Administrator',
    },
  },
  users: {
    'user-uuid-1': {
      username: 'alice',
      password_hash: adminPasswordHash,
      full_name: 'Alice Smith',
      enabled: true,
    },
    'user-uuid-2': {
      username: 'bob',
      password_hash: adminPasswordHash,
      full_name: 'Bob Jones',
      enabled: false,
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
  vi.mocked(saveSettings).mockImplementation(() => undefined)
  vi.mocked(findUser).mockImplementation((username) => {
    const adminRec = mockSettings.admin_users[username]
    if (adminRec !== undefined) return { type: 'admin', username, record: adminRec }
    for (const [id, record] of Object.entries(mockSettings.users)) {
      if (record.username === username) return { type: 'user', id, record }
    }
    return null
  })
})

describe('authenticate', () => {
  it('returns session for a valid admin', async () => {
    const session = await authenticate({ username: 'admin', password: 'password123' })
    expect(session.isAdmin).toBe(true)
    expect(session.resourceId).toBeNull()
    expect(session.username).toBe('admin')
  })

  it('returns session for a valid regular user', async () => {
    const session = await authenticate({ username: 'alice', password: 'password123' })
    expect(session.isAdmin).toBe(false)
    expect(session.resourceId).toBe('user-uuid-1')
  })

  it('throws UnauthorizedError for unknown user', async () => {
    await expect(authenticate({ username: 'nobody', password: 'x' })).rejects.toThrow('Invalid credentials')
  })

  it('throws UnauthorizedError for wrong password', async () => {
    await expect(authenticate({ username: 'admin', password: 'wrong' })).rejects.toThrow('Invalid credentials')
  })

  it('throws UnauthorizedError for disabled user', async () => {
    await expect(authenticate({ username: 'bob', password: 'password123' })).rejects.toThrow('disabled')
  })
})

describe('listUsers', () => {
  it('returns both admin and regular users', () => {
    const users = listUsers()
    const adminUser = users.find((u) => u.username === 'admin')
    const alice = users.find((u) => u.username === 'alice')
    expect(adminUser?.isAdmin).toBe(true)
    expect(alice?.isAdmin).toBe(false)
    expect(users.length).toBe(3)
  })

  it('does not expose password hashes', () => {
    const users = listUsers()
    for (const u of users) {
      expect(u).not.toHaveProperty('password_hash')
    }
  })
})

describe('createUser', () => {
  it('throws ValidationError for short password', async () => {
    await expect(createUser({ username: 'new', password: 'short', full_name: 'New', isAdmin: false }))
      .rejects.toThrow('at least 8 characters')
  })

  it('throws ConflictError for duplicate username', async () => {
    await expect(createUser({ username: 'admin', password: 'password123', full_name: 'Dup', isAdmin: true }))
      .rejects.toThrow('already exists')
  })

  it('creates a regular user with UUID key', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await createUser({ username: 'carol', password: 'password123', full_name: 'Carol', isAdmin: false })
    expect(result.isAdmin).toBe(false)
    expect(result.username).toBe('carol')
    expect(result.id).not.toBe('carol')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('creates an admin user with username as key', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await createUser({ username: 'superadmin', password: 'password123', full_name: 'Super', isAdmin: true })
    expect(result.isAdmin).toBe(true)
    expect(result.id).toBe('superadmin')
  })
})

describe('updateUser', () => {
  it('updates admin password and full_name without renaming', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    const result = await updateUser('admin', { password: 'newpassword1', full_name: 'New Name' })
    expect(result.isAdmin).toBe(true)
    expect(result.full_name).toBe('New Name')
    expect(result.id).toBe('admin')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('renames an admin to a new username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { username: 'superadmin', full_name: 'Super Admin' })
    expect(result.username).toBe('superadmin')
    expect(result.id).toBe('superadmin')
    expect(result.isAdmin).toBe(true)
  })

  it('renames an admin with new password and without full_name (uses existing)', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { username: 'superadmin', password: 'newpassword1' })
    expect(result.username).toBe('superadmin')
    expect(result.full_name).toBe('Administrator')
  })

  it('throws ConflictError when renaming admin to existing username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('admin', { username: 'alice' })).rejects.toThrow('already exists')
  })

  it('updates a regular user full_name, enabled, and username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('user-uuid-1', { username: 'carol', full_name: 'Carol Smith', enabled: false })
    expect(result.username).toBe('carol')
    expect(result.full_name).toBe('Carol Smith')
    expect(result.enabled).toBe(false)
    expect(result.isAdmin).toBe(false)
  })

  it('updates a regular user password', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    const result = await updateUser('user-uuid-1', { password: 'newpassword1' })
    expect(result.username).toBe('alice')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('throws ConflictError when renaming regular user to existing username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('user-uuid-1', { username: 'bob' })).rejects.toThrow('already exists')
  })

  it('throws NotFoundError for unknown user id', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('does-not-exist', {})).rejects.toThrow('not found')
  })
})

describe('deleteUser', () => {
  it('soft-deletes a regular user by setting enabled=false', () => {
    deleteUser('user-uuid-1')
    const lastCall = vi.mocked(saveSettings).mock.calls[vi.mocked(saveSettings).mock.calls.length - 1]
    const saved = lastCall?.[0]
    expect(saved?.users['user-uuid-1']?.enabled).toBe(false)
  })

  it('throws ForbiddenError when trying to delete an admin', () => {
    expect(() => deleteUser('admin')).toThrow('Cannot delete admin')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteUser('does-not-exist')).toThrow('not found')
  })
})
