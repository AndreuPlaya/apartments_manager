import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  user: { username: 'admin', isAdmin: true, resourceId: null as string | null },
}))

vi.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set('user', authState.user)
    await next()
  },
}))
vi.mock('../../src/application/listingService.js')
vi.mock('../../src/application/reservationService.js')
vi.mock('../../src/application/guestService.js')
vi.mock('../../src/application/channelService.js')
vi.mock('../../src/application/calendarLinkService.js')
vi.mock('../../src/application/userService.js')
vi.mock('../../src/infrastructure/settings.js')
vi.mock('../../src/routes/auth.js', () => ({ issueSessionCookie: vi.fn() }))

import { listListings } from '../../src/application/listingService.js'
import { listReservations } from '../../src/application/reservationService.js'
import { listCalendarLinks } from '../../src/application/calendarLinkService.js'
import { listChannels } from '../../src/application/channelService.js'
import { listGuests } from '../../src/application/guestService.js'
import { getSelfProfile, updateSelfProfile, changeSelfPassword } from '../../src/application/userService.js'
import { findUser } from '../../src/infrastructure/settings.js'
import { issueSessionCookie } from '../../src/routes/auth.js'
import { NotFoundError } from '../../src/application/errors.js'

import editorRoutes from '../../src/routes/editor.js'

const defaultProfile = { username: 'admin', full_name: 'Admin', email: undefined as string | undefined, is_admin: true }

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { username: 'admin', isAdmin: true, resourceId: null }
  vi.mocked(listListings).mockReturnValue([])
  vi.mocked(listReservations).mockReturnValue([])
  vi.mocked(listGuests).mockReturnValue([])
  vi.mocked(listChannels).mockReturnValue([])
  vi.mocked(listCalendarLinks).mockReturnValue([])
  vi.mocked(getSelfProfile).mockResolvedValue(defaultProfile)
  vi.mocked(updateSelfProfile).mockResolvedValue(defaultProfile)
  vi.mocked(changeSelfPassword).mockResolvedValue(undefined)
  vi.mocked(findUser).mockReturnValue(null)
  vi.mocked(issueSessionCookie).mockResolvedValue(undefined)
})

function makeApp() {
  const app = new Hono()
  app.route('/', editorRoutes)
  return app
}

describe('GET /api/listings', () => {
  it('returns listing list', async () => {
    vi.mocked(listListings).mockReturnValue([{ id: 'apt1' } as any])
    const res = await makeApp().request('/api/listings')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([{ id: 'apt1' }])
  })
})

describe('GET /api/reservations', () => {
  it('calls listReservations with no filters when no query params', async () => {
    const res = await makeApp().request('/api/reservations')
    expect(res.status).toBe(200)
    expect(listReservations).toHaveBeenCalledWith({ listingId: undefined, from: undefined, to: undefined })
  })

  it('passes query params as filters', async () => {
    await makeApp().request('/api/reservations?listingId=apt1&from=2025-06-01&to=2025-06-30')
    expect(listReservations).toHaveBeenCalledWith({ listingId: 'apt1', from: '2025-06-01', to: '2025-06-30' })
  })
})

describe('GET /api/clients', () => {
  it('returns guest list', async () => {
    vi.mocked(listGuests).mockReturnValue([{ id: 'cli1', name: 'Alice' } as any])
    const res = await makeApp().request('/api/clients')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'cli1', name: 'Alice' }])
  })
})

describe('GET /api/channels', () => {
  it('returns channel list', async () => {
    vi.mocked(listChannels).mockReturnValue([{ id: 'ch1' } as any])
    const res = await makeApp().request('/api/channels')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'ch1' }])
  })
})

describe('GET /api/calendar-links', () => {
  it('returns calendar link list', async () => {
    vi.mocked(listCalendarLinks).mockReturnValue([{ id: 'cl1', channelId: 'ch1', listingId: 'apt1', url: 'https://x' } as any])
    const res = await makeApp().request('/api/calendar-links')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'cl1', channelId: 'ch1', listingId: 'apt1', url: 'https://x' }])
  })
})

describe('GET /api/profile', () => {
  it('returns the current user profile', async () => {
    const res = await makeApp().request('/api/profile')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(defaultProfile)
  })

  it('returns error response when service throws', async () => {
    vi.mocked(getSelfProfile).mockRejectedValue(new NotFoundError('User not found'))
    const res = await makeApp().request('/api/profile')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })
})

describe('PATCH /api/profile', () => {
  const patch = (body: object) =>
    makeApp().request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('updates profile without username change and does not re-issue cookie', async () => {
    const updated = { ...defaultProfile, full_name: 'New Name', email: 'a@b.com' }
    vi.mocked(updateSelfProfile).mockResolvedValue(updated)
    const res = await patch({ full_name: 'New Name', email: 'a@b.com' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
    expect(issueSessionCookie).not.toHaveBeenCalled()
  })

  it('re-issues session cookie when admin username changes', async () => {
    const updated = { ...defaultProfile, username: 'newadmin' }
    vi.mocked(updateSelfProfile).mockResolvedValue(updated)
    const res = await patch({ username: 'newadmin' })
    expect(res.status).toBe(200)
    expect(issueSessionCookie).toHaveBeenCalledOnce()
    expect(issueSessionCookie).toHaveBeenCalledWith(expect.anything(), 'newadmin', true, null)
  })

  it('re-issues session cookie with resourceId when regular user changes username', async () => {
    authState.user = { username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' }
    const updated = { username: 'alicenew', full_name: 'Alice', email: undefined, is_admin: false }
    vi.mocked(updateSelfProfile).mockResolvedValue(updated)
    vi.mocked(findUser).mockReturnValue({ type: 'user', id: 'user-uuid-1', record: {} as any })
    const res = await patch({ username: 'alicenew' })
    expect(res.status).toBe(200)
    expect(issueSessionCookie).toHaveBeenCalledWith(expect.anything(), 'alicenew', false, 'user-uuid-1')
  })

  it('returns error response when service throws', async () => {
    vi.mocked(updateSelfProfile).mockRejectedValue(new NotFoundError('User not found'))
    const res = await patch({ full_name: 'x' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })
})

describe('PATCH /api/profile/password', () => {
  const patchPw = (body: object) =>
    makeApp().request('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('changes password successfully', async () => {
    const res = await patchPw({ current_password: 'oldpass12', password: 'newpass12' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 400 when current_password is missing', async () => {
    const res = await patchPw({ password: 'newpass12' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await patchPw({ current_password: 'oldpass12' })
    expect(res.status).toBe(400)
  })

  it('returns error response when service throws', async () => {
    vi.mocked(changeSelfPassword).mockRejectedValue(new NotFoundError('User not found'))
    const res = await patchPw({ current_password: 'oldpass12', password: 'newpass12' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })
})
