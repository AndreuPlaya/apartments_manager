import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/api/client', () => ({
  api: { auth: { config: vi.fn() } },
}))

import { api } from '../../src/api/client'
import {
  clearAuthConfig,
  ensureAuthConfig,
  setAuthConfig,
  useAuthConfig,
} from '../../src/composables/useAuthConfig'

beforeEach(() => {
  clearAuthConfig()
  vi.clearAllMocks()
})

describe('ensureAuthConfig', () => {
  it('asks the server once and serves every later reader from memory', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })

    expect(await ensureAuthConfig()).toEqual({ username: 'admin', isAdmin: true })
    expect(await ensureAuthConfig()).toEqual({ username: 'admin', isAdmin: true })
    expect(api.auth.config).toHaveBeenCalledTimes(1)
  })

  it('shares one request between callers that ask in the same tick', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })

    // What a cold protected route does: the guard and the mounting page both ask.
    const [a, b] = await Promise.all([ensureAuthConfig(), ensureAuthConfig()])

    expect(a).toEqual({ username: 'alice', isAdmin: false })
    expect(b).toEqual(a)
    expect(api.auth.config).toHaveBeenCalledTimes(1)
  })

  it('reads an anonymous answer as null instead of throwing', async () => {
    // `{ ok: false }` arrives with a 401. The body is the answer, not a fault.
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })

    expect(await ensureAuthConfig()).toBeNull()
    expect(useAuthConfig().isAuthenticated.value).toBe(false)
  })

  it('does not cache an anonymous answer, so logging in is seen', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    expect(await ensureAuthConfig()).toBeNull()

    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    expect(await ensureAuthConfig()).toEqual({ username: 'alice', isAdmin: false })
  })

  it('retries after a failed request rather than wedging on the dead promise', async () => {
    vi.mocked(api.auth.config).mockRejectedValueOnce(new Error('offline'))
    await expect(ensureAuthConfig()).rejects.toThrow('offline')

    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    expect(await ensureAuthConfig()).toEqual({ username: 'admin', isAdmin: true })
  })
})

describe('what the components read', () => {
  it('reports the session the login reply handed over, without a request', async () => {
    setAuthConfig({ username: 'admin', isAdmin: true })

    const { username, isAdmin, isAuthenticated } = useAuthConfig()
    expect(username.value).toBe('admin')
    expect(isAdmin.value).toBe(true)
    expect(isAuthenticated.value).toBe(true)
    expect(await ensureAuthConfig()).toEqual({ username: 'admin', isAdmin: true })
    expect(api.auth.config).not.toHaveBeenCalled()
  })

  it('falls back to anonymous defaults once the session is dropped', () => {
    setAuthConfig({ username: 'admin', isAdmin: true })
    const { username, isAdmin, isAuthenticated } = useAuthConfig()

    clearAuthConfig()

    expect(username.value).toBe('')
    expect(isAdmin.value).toBe(false)
    expect(isAuthenticated.value).toBe(false)
  })
})
