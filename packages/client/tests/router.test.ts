import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/api/client', async (importActual) => {
  const actual = await importActual<typeof import('../src/api/client')>()
  return {
    ...actual,
    setSessionExpiredHandler: vi.fn(),
    api: {
      auth: { config: vi.fn(), setupRequired: vi.fn() },
      listings: { list: vi.fn() },
    },
  }
})

import { api, setSessionExpiredHandler } from '../src/api/client'
import { clearCachedConfig, setCachedConfig, default as router } from '../src/router'

/**
 * The router installs its handler as a module side effect, so the mocked
 * setter is the only way to get hold of it. Captured at file-evaluation time,
 * before the beforeEach that clears mock calls.
 */
const sessionExpired = vi.mocked(setSessionExpiredHandler).mock.calls[0]![0]!

beforeEach(() => {
  clearCachedConfig()
  vi.clearAllMocks()
})

describe('clearCachedConfig', () => {
  it('clears cached config so next navigation re-fetches', async () => {
    setCachedConfig({ ok: true, is_admin: false, username: 'alice' })
    clearCachedConfig()
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.auth.setupRequired).mockResolvedValue(false)
    await router.push('/')
    expect(api.auth.config).toHaveBeenCalled()
  })
})

describe('setCachedConfig', () => {
  it('stores config so the guard skips fetching', async () => {
    setCachedConfig({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/config')
    expect(api.auth.config).not.toHaveBeenCalled()
  })
})

describe('router beforeEach guard', () => {
  it('allows /login without checking config', async () => {
    await router.push('/login')
    expect(api.auth.config).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows /setup without checking config', async () => {
    await router.push('/setup')
    expect(api.auth.config).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/setup')
  })

  it('redirects to /setup when the server has no admin yet', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.auth.setupRequired).mockResolvedValue(true)
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/setup')
  })

  it('redirects to /login when there is an admin but no session', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.auth.setupRequired).mockResolvedValue(false)
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows a non-admin to access /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows a non-admin to access /calendar', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/calendar')
    expect(router.currentRoute.value.path).toBe('/calendar')
  })

  it('allows a non-admin to access /reservations', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/reservations')
    expect(router.currentRoute.value.path).toBe('/reservations')
  })

  it('allows a non-admin to access /guests', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/guests')
    expect(router.currentRoute.value.path).toBe('/guests')
  })

  it('allows a non-admin to access /profile', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/profile')
    expect(router.currentRoute.value.path).toBe('/profile')
  })

  it('redirects non-admin away from /config to /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/config')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects non-admin away from /metrics to /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/metrics')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects non-admin away from /admin to /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows admin to access /config', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/config')
    expect(router.currentRoute.value.path).toBe('/config')
  })

  it('allows admin to access /metrics', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/metrics')
    expect(router.currentRoute.value.path).toBe('/metrics')
  })

  it('redirects /admin to /config for admin users', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/config')
  })

  it('uses cached config on subsequent navigations', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/')
    await router.push('/config')
    expect(api.auth.config).toHaveBeenCalledTimes(1)
  })
})

describe('the session-expired handler the router installs', () => {
  it('sends the operator to the login screen instead of leaving the page mounted', async () => {
    setCachedConfig({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/config')
    expect(router.currentRoute.value.path).toBe('/config')

    // What api/client.ts calls on a 401 from any data route.
    sessionExpired()
    await router.isReady()
    await new Promise((r) => setTimeout(r, 0))

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('does not re-navigate when already on the login screen', async () => {
    await router.push('/login')
    const before = router.currentRoute.value.fullPath

    sessionExpired()
    await new Promise((r) => setTimeout(r, 0))

    expect(router.currentRoute.value.fullPath).toBe(before)
  })

  it('drops the cached config, so the next navigation asks the server again', async () => {
    setCachedConfig({ ok: true, is_admin: true, username: 'admin' })
    sessionExpired()
    await new Promise((r) => setTimeout(r, 0))

    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/config')

    expect(api.auth.config).toHaveBeenCalled()
  })
})
