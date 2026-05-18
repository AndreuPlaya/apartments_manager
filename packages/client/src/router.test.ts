import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api/client', async (importActual) => {
  const actual = await importActual<typeof import('./api/client')>()
  return {
    ...actual,
    api: {
      auth: { config: vi.fn() },
      apartments: { list: vi.fn() },
    },
  }
})

import { ApiError, api } from './api/client'
import { clearCachedConfig, setCachedConfig, default as router } from './router'

beforeEach(() => {
  clearCachedConfig()
  vi.clearAllMocks()
})

describe('clearCachedConfig', () => {
  it('clears cached config so next navigation re-fetches', async () => {
    setCachedConfig({ ok: true, is_admin: false, username: 'alice' })
    clearCachedConfig()
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.apartments.list).mockResolvedValue([])
    await router.push('/')
    expect(api.auth.config).toHaveBeenCalled()
  })
})

describe('setCachedConfig', () => {
  it('stores config so the guard skips fetching', async () => {
    setCachedConfig({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/admin')
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

  it('redirects to /setup when not logged in and apartments returns 503', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.apartments.list).mockRejectedValue(new ApiError(503, 'Service Unavailable'))
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/setup')
  })

  it('redirects to /login when not logged in and apartments does not 503', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: false })
    vi.mocked(api.apartments.list).mockResolvedValue([])
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows a non-admin to access /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects non-admin away from /admin to /', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: false, username: 'alice' })
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows admin to access /admin', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/admin')
  })

  it('uses cached config on subsequent navigations', async () => {
    vi.mocked(api.auth.config).mockResolvedValue({ ok: true, is_admin: true, username: 'admin' })
    await router.push('/')
    await router.push('/admin')
    expect(api.auth.config).toHaveBeenCalledTimes(1)
  })
})
