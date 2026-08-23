import bcrypt from 'bcryptjs'
import { pbkdf2Sync } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser, Settings } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/settings.js')
import {
  findUser,
  loadSettings,
  saveSettings,
} from '../../src/infrastructure/settings.js'

import { authenticate, changeSelfPassword, createUser, deleteUser, getSelfProfile, listUsers, updateSelfProfile, updateUser } from '../../src/application/userService.js'

// Pre-compute a real bcrypt hash for 'password123' (4 rounds = fast in tests)
const adminPasswordHash = bcrypt.hashSync('password123', 4)

/**
 * The admin making the request. Deliberately somebody other than the accounts
 * these tests edit — `updateUser` and `deleteUser` refuse to disable, demote or
 * delete the caller's own account, and the self-guards get their own tests.
 */
const actor: SessionUser = { username: 'root', isAdmin: true, resourceId: null }

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
    const result = await updateUser('admin', { password: 'newpassword1', full_name: 'New Name' }, actor)
    expect(result.isAdmin).toBe(true)
    expect(result.full_name).toBe('New Name')
    expect(result.id).toBe('admin')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('renames an admin to a new username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { username: 'superadmin', full_name: 'Super Admin' }, actor)
    expect(result.username).toBe('superadmin')
    expect(result.id).toBe('superadmin')
    expect(result.isAdmin).toBe(true)
  })

  it('renames an admin with new password and without full_name (uses existing)', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { username: 'superadmin', password: 'newpassword1' }, actor)
    expect(result.username).toBe('superadmin')
    expect(result.full_name).toBe('Administrator')
  })

  it('throws ConflictError when renaming admin to existing username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('admin', { username: 'alice' }, actor)).rejects.toThrow('already exists')
  })

  it('updates a regular user full_name, enabled, and username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('user-uuid-1', { username: 'carol', full_name: 'Carol Smith', enabled: false }, actor)
    expect(result.username).toBe('carol')
    expect(result.full_name).toBe('Carol Smith')
    expect(result.enabled).toBe(false)
    expect(result.isAdmin).toBe(false)
  })

  it('updates a regular user password', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    const result = await updateUser('user-uuid-1', { password: 'newpassword1' }, actor)
    expect(result.username).toBe('alice')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('throws ConflictError when renaming regular user to existing username', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('user-uuid-1', { username: 'bob' }, actor)).rejects.toThrow('already exists')
  })

  it('throws NotFoundError for unknown user id', async () => {
    vi.mocked(loadSettings).mockReturnValue(structuredClone(mockSettings))
    await expect(updateUser('does-not-exist', {}, actor)).rejects.toThrow('not found')
  })
})

function savedSettings(): Settings | undefined {
  const calls = vi.mocked(saveSettings).mock.calls
  return calls[calls.length - 1]?.[0]
}

/** `mockSettings` holds a single admin; a demotion or a deletion needs two. */
function withTwoAdmins(): Settings {
  const settings = structuredClone(mockSettings)
  settings.admin_users['second'] = { password_hash: adminPasswordHash, full_name: 'Second Admin' }
  vi.mocked(loadSettings).mockReturnValue(settings)
  return settings
}

describe('deleteUser', () => {
  it('removes a regular user outright', () => {
    deleteUser('user-uuid-1', actor)
    expect(savedSettings()?.users['user-uuid-1']).toBeUndefined()
  })

  it('removes an admin when another enabled admin remains', () => {
    withTwoAdmins()
    deleteUser('admin', actor)
    expect(savedSettings()?.admin_users['admin']).toBeUndefined()
    expect(savedSettings()?.admin_users['second']).toBeDefined()
  })

  it('refuses to delete the last enabled admin', () => {
    expect(() => deleteUser('admin', actor)).toThrow('At least one enabled admin')
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('refuses to delete the caller\'s own account', () => {
    withTwoAdmins()
    expect(() => deleteUser('admin', { username: 'admin', isAdmin: true, resourceId: null }))
      .toThrow('your own account')
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteUser('does-not-exist', actor)).toThrow('not found')
  })
})

describe('updateUser — role', () => {
  it('promotes an employee to admin, keeping the password hash', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('user-uuid-1', { isAdmin: true }, actor)
    expect(result.isAdmin).toBe(true)
    expect(result.id).toBe('alice')
    expect(savedSettings()?.users['user-uuid-1']).toBeUndefined()
    expect(savedSettings()?.admin_users['alice']?.password_hash).toBe(adminPasswordHash)
  })

  it('demotes an admin to employee under a fresh UUID', async () => {
    withTwoAdmins()
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { isAdmin: false }, actor)
    expect(result.isAdmin).toBe(false)
    expect(result.id).not.toBe('admin')
    expect(savedSettings()?.admin_users['admin']).toBeUndefined()
    const moved = savedSettings()?.users[result.id]
    expect(moved?.username).toBe('admin')
    expect(moved?.password_hash).toBe(adminPasswordHash)
  })

  it('refuses to demote the last enabled admin', async () => {
    await expect(updateUser('admin', { isAdmin: false }, actor)).rejects.toThrow('At least one enabled admin')
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('refuses to disable the last enabled admin', async () => {
    await expect(updateUser('admin', { enabled: false }, actor)).rejects.toThrow('At least one enabled admin')
  })

  it('disables an admin when another enabled admin remains', async () => {
    withTwoAdmins()
    const result = await updateUser('admin', { enabled: false }, actor)
    expect(result.enabled).toBe(false)
    expect(savedSettings()?.admin_users['admin']?.enabled).toBe(false)
  })

  it('refuses to remove the caller\'s own admin access', async () => {
    withTwoAdmins()
    await expect(
      updateUser('admin', { isAdmin: false }, { username: 'admin', isAdmin: true, resourceId: null }),
    ).rejects.toThrow('your own admin access')
  })

  it('refuses to disable the caller\'s own account', async () => {
    withTwoAdmins()
    await expect(
      updateUser('admin', { enabled: false }, { username: 'admin', isAdmin: true, resourceId: null }),
    ).rejects.toThrow('your own account')
  })

  it('keeps email and disabled state when renaming an admin', async () => {
    const settings = structuredClone(mockSettings)
    settings.admin_users['admin']!.email = 'admin@test.com'
    settings.admin_users['second'] = { password_hash: adminPasswordHash, full_name: 'Second', enabled: true }
    settings.admin_users['admin']!.enabled = false
    vi.mocked(loadSettings).mockReturnValue(settings)
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateUser('admin', { username: 'renamed' }, actor)
    expect(result.email).toBe('admin@test.com')
    expect(result.enabled).toBe(false)
    expect(savedSettings()?.admin_users['renamed']?.email).toBe('admin@test.com')
  })
})

describe('user email', () => {
  it('stores an email on create', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await createUser({ username: 'carol', password: 'password123', full_name: 'Carol', isAdmin: false, email: ' carol@test.com ' })
    expect(result.email).toBe('carol@test.com')
  })

  it('treats a blank email as not provided', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await createUser({ username: 'carol', password: 'password123', full_name: 'Carol', isAdmin: false, email: '  ' })
    expect(result.email).toBeUndefined()
  })

  it('rejects a malformed email', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    await expect(
      createUser({ username: 'carol', password: 'password123', full_name: 'Carol', isAdmin: false, email: 'carol@' }),
    ).rejects.toThrow('not a valid email')
  })

  it('rejects an email another account already holds', async () => {
    const settings = structuredClone(mockSettings)
    settings.users['user-uuid-1']!.email = 'taken@test.com'
    vi.mocked(loadSettings).mockReturnValue(settings)
    vi.mocked(findUser).mockReturnValue(null)
    await expect(
      createUser({ username: 'carol', password: 'password123', full_name: 'Carol', isAdmin: false, email: 'TAKEN@test.com' }),
    ).rejects.toThrow('already exists')
  })

  it('updates and clears an email', async () => {
    const result = await updateUser('user-uuid-1', { email: 'alice@test.com' }, actor)
    expect(result.email).toBe('alice@test.com')
    const cleared = await updateUser('user-uuid-1', { email: '' }, actor)
    expect(cleared.email).toBeUndefined()
  })

  it('lets an account keep its own email', async () => {
    const settings = structuredClone(mockSettings)
    settings.users['user-uuid-1']!.email = 'alice@test.com'
    vi.mocked(loadSettings).mockReturnValue(settings)
    const result = await updateUser('user-uuid-1', { email: 'alice@test.com', full_name: 'Alice B' }, actor)
    expect(result.email).toBe('alice@test.com')
    expect(result.full_name).toBe('Alice B')
  })
})

describe('getSelfProfile', () => {
  it('returns profile for admin user', async () => {
    const profile = await getSelfProfile({ username: 'admin', isAdmin: true, resourceId: null })
    expect(profile.username).toBe('admin')
    expect(profile.full_name).toBe('Administrator')
    expect(profile.is_admin).toBe(true)
  })

  it('throws NotFoundError for missing admin', async () => {
    await expect(getSelfProfile({ username: 'nobody', isAdmin: true, resourceId: null })).rejects.toThrow('not found')
  })

  it('returns profile for regular user', async () => {
    const profile = await getSelfProfile({ username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' })
    expect(profile.username).toBe('alice')
    expect(profile.is_admin).toBe(false)
  })

  it('throws NotFoundError for missing regular user', async () => {
    await expect(getSelfProfile({ username: 'alice', isAdmin: false, resourceId: 'no-such-id' })).rejects.toThrow('not found')
  })
})

describe('updateSelfProfile', () => {
  it('updates admin full_name and email without renaming', async () => {
    const result = await updateSelfProfile(
      { username: 'admin', isAdmin: true, resourceId: null },
      { full_name: 'New Name', email: 'new@test.com' },
    )
    expect(result.full_name).toBe('New Name')
    expect(result.email).toBe('new@test.com')
    expect(result.username).toBe('admin')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('renames admin to a new username with email', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateSelfProfile(
      { username: 'admin', isAdmin: true, resourceId: null },
      { username: 'newadmin', email: 'x@test.com' },
    )
    expect(result.username).toBe('newadmin')
    expect(result.email).toBe('x@test.com')
    expect(result.is_admin).toBe(true)
  })

  it('renames admin to a new username without email preserves existing email', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const settingsWithEmail = structuredClone(mockSettings)
    settingsWithEmail.admin_users['admin'].email = 'original@test.com'
    vi.mocked(loadSettings).mockReturnValue(settingsWithEmail)
    const result = await updateSelfProfile(
      { username: 'admin', isAdmin: true, resourceId: null },
      { username: 'newadmin' },
    )
    expect(result.username).toBe('newadmin')
    expect(result.email).toBe('original@test.com')
  })

  it('throws ConflictError when renaming admin to existing username', async () => {
    await expect(
      updateSelfProfile({ username: 'admin', isAdmin: true, resourceId: null }, { username: 'alice' }),
    ).rejects.toThrow('already exists')
  })

  it('throws NotFoundError for missing admin', async () => {
    await expect(
      updateSelfProfile({ username: 'nobody', isAdmin: true, resourceId: null }, {}),
    ).rejects.toThrow('not found')
  })

  it('updates regular user full_name and email without rename', async () => {
    const result = await updateSelfProfile(
      { username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' },
      { full_name: 'Alice B', email: 'alice@test.com' },
    )
    expect(result.full_name).toBe('Alice B')
    expect(result.email).toBe('alice@test.com')
    expect(result.username).toBe('alice')
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('renames regular user to a new username', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const result = await updateSelfProfile(
      { username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' },
      { username: 'alicenew' },
    )
    expect(result.username).toBe('alicenew')
  })

  it('throws ConflictError when renaming regular user to existing username', async () => {
    await expect(
      updateSelfProfile({ username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' }, { username: 'admin' }),
    ).rejects.toThrow('already exists')
  })

  it('throws NotFoundError for missing regular user', async () => {
    await expect(
      updateSelfProfile({ username: 'alice', isAdmin: false, resourceId: 'no-such-id' }, {}),
    ).rejects.toThrow('not found')
  })
})

describe('changeSelfPassword', () => {
  it('throws ValidationError for short password', async () => {
    await expect(
      changeSelfPassword({ username: 'admin', isAdmin: true, resourceId: null }, { current_password: 'password123', password: 'short' }),
    ).rejects.toThrow('at least 8 characters')
  })

  it('changes password for admin', async () => {
    await expect(
      changeSelfPassword({ username: 'admin', isAdmin: true, resourceId: null }, { current_password: 'password123', password: 'newpassword1' }),
    ).resolves.toBeUndefined()
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('throws UnauthorizedError for wrong current password (admin)', async () => {
    await expect(
      changeSelfPassword({ username: 'admin', isAdmin: true, resourceId: null }, { current_password: 'wrongpass', password: 'newpassword1' }),
    ).rejects.toThrow('incorrect')
  })

  it('throws NotFoundError for missing admin', async () => {
    await expect(
      changeSelfPassword({ username: 'nobody', isAdmin: true, resourceId: null }, { current_password: 'password123', password: 'newpassword1' }),
    ).rejects.toThrow('not found')
  })

  it('changes password for regular user', async () => {
    await expect(
      changeSelfPassword({ username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' }, { current_password: 'password123', password: 'newpassword1' }),
    ).resolves.toBeUndefined()
    expect(saveSettings).toHaveBeenCalledOnce()
  })

  it('throws UnauthorizedError for wrong current password (regular user)', async () => {
    await expect(
      changeSelfPassword({ username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' }, { current_password: 'wrongpass', password: 'newpassword1' }),
    ).rejects.toThrow('incorrect')
  })

  it('throws NotFoundError for missing regular user', async () => {
    await expect(
      changeSelfPassword({ username: 'alice', isAdmin: false, resourceId: 'no-such-id' }, { current_password: 'password123', password: 'newpassword1' }),
    ).rejects.toThrow('not found')
  })
})

// ---------------------------------------------------------------------------
// Legacy hashes
//
// `authenticate` used to compare every stored hash as bcrypt, which failed on
// every account carried over from the Flask application — the werkzeug fallback
// existed but nothing reached it from the login screen.
// ---------------------------------------------------------------------------

function werkzeugHash(
  password: string,
  { digest = 'sha256', iterations = 1000, salt = 'saltysalt' } = {},
): string {
  const hex = pbkdf2Sync(password, salt, iterations, 32, digest).toString('hex')
  return `pbkdf2:${digest}:${iterations}$${salt}$${hex}`
}

function legacyAccount(password_hash: string) {
  vi.mocked(findUser).mockReturnValue({
    type: 'user',
    id: 'legacy-id',
    record: { username: 'legacy', password_hash, full_name: 'Legacy User', enabled: true },
  })
}

describe('authenticate — legacy werkzeug hashes', () => {
  it('accepts the right password', async () => {
    legacyAccount(werkzeugHash('password123'))
    const session = await authenticate({ username: 'legacy', password: 'password123' })
    expect(session.resourceId).toBe('legacy-id')
  })

  it('refuses the wrong password', async () => {
    legacyAccount(werkzeugHash('password123'))
    await expect(authenticate({ username: 'legacy', password: 'wrongpassword' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses a hash missing its salt section', async () => {
    legacyAccount('pbkdf2:sha256:1000$onlysalt')
    await expect(authenticate({ username: 'legacy', password: 'password123' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses a hash without an iteration count', async () => {
    legacyAccount('pbkdf2:sha256$saltysalt$deadbeef')
    await expect(authenticate({ username: 'legacy', password: 'password123' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses a non-positive iteration count', async () => {
    legacyAccount('pbkdf2:sha256:0$saltysalt$deadbeef')
    await expect(authenticate({ username: 'legacy', password: 'password123' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses an unknown digest instead of crashing', async () => {
    legacyAccount('pbkdf2:notadigest:1000$saltysalt$deadbeef')
    await expect(authenticate({ username: 'legacy', password: 'password123' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses a truncated hash without comparing', async () => {
    legacyAccount('pbkdf2:sha256:1000$saltysalt$abcd')
    await expect(authenticate({ username: 'legacy', password: 'password123' })).rejects.toThrow('Invalid credentials')
  })

  it('refuses a disabled admin at the login screen', async () => {
    vi.mocked(findUser).mockReturnValue({
      type: 'admin',
      username: 'admin',
      record: { password_hash: adminPasswordHash, full_name: 'Administrator', enabled: false },
    })
    await expect(authenticate({ username: 'admin', password: 'password123' })).rejects.toThrow('disabled')
  })
})

describe('updateUser — validation', () => {
  it('rejects a blank username', async () => {
    await expect(updateUser('user-uuid-1', { username: '   ' }, actor)).rejects.toThrow('Username is required')
  })

  it('rejects a password under 8 characters', async () => {
    await expect(updateUser('user-uuid-1', { password: 'short' }, actor)).rejects.toThrow('at least 8 characters')
  })

  it('treats an empty password as "leave it alone"', async () => {
    const result = await updateUser('user-uuid-1', { password: '' }, actor)
    expect(savedSettings()?.users[result.id]?.password_hash).toBe(adminPasswordHash)
  })

  it('renaming to the same name in a different case is not a conflict', async () => {
    const result = await updateUser('user-uuid-1', { username: 'Alice' }, actor)
    expect(result.username).toBe('Alice')
  })
})
