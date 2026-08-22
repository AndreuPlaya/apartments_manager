import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set('user', { username: 'admin', isAdmin: true, resourceId: null })
    await next()
  },
}))
vi.mock('../../src/middleware/admin.js', () => ({
  adminMiddleware: async (_c: any, next: any) => { await next() },
}))
vi.mock('../../src/infrastructure/audit.js')
vi.mock('../../src/application/listingService.js')
vi.mock('../../src/application/reservationService.js')
vi.mock('../../src/application/calendarLinkService.js')
vi.mock('../../src/application/channelService.js')
vi.mock('../../src/application/guestService.js')
vi.mock('../../src/application/metricsService.js')
vi.mock('../../src/application/userService.js')

import { createListing, deleteListing, updateListing } from '../../src/application/listingService.js'
import { createReservation, deleteReservation, updateReservation } from '../../src/application/reservationService.js'
import { deleteCalendarLink, upsertCalendarLink } from '../../src/application/calendarLinkService.js'
import { createChannel, deleteChannel, updateChannel } from '../../src/application/channelService.js'
import { createGuest, deleteGuest, updateGuest } from '../../src/application/guestService.js'
import { getMetrics } from '../../src/application/metricsService.js'
import { createUser, deleteUser, listUsers, updateUser } from '../../src/application/userService.js'
import { ConflictError, NotFoundError } from '../../src/application/errors.js'

import adminRoutes from '../../src/routes/admin.js'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

beforeEach(() => {
  vi.clearAllMocks()
})

function makeApp() {
  const app = new Hono()
  app.route('/', adminRoutes)
  return app
}

// ── Listings ────────────────────────────────────────────────────────────────

describe('Listings admin routes', () => {
  const aptBody = {
    name: 'Beach House', address: '1 Ocean', floor: 1, door: 'A',
    nightlyRate: 100, minNights: 2, maxAdults: 4, rooms: 2, bathrooms: 1, isActive: true,
  }
  const apt = { id: 'apt1', ...aptBody }

  it('POST /api/admin/listings returns 201 on success', async () => {
    vi.mocked(createListing).mockReturnValue(apt as any)
    const res = await makeApp().request('/api/admin/listings', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(aptBody),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(apt)
  })

  it('POST /api/admin/listings returns error status on AppError', async () => {
    vi.mocked(createListing).mockImplementation(() => { throw new ConflictError('Already exists') })
    const res = await makeApp().request('/api/admin/listings', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(aptBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/listings/:id returns 200 on success', async () => {
    vi.mocked(updateListing).mockReturnValue(apt as any)
    const res = await makeApp().request('/api/admin/listings/apt1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ nightlyRate: 120 }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/listings/:id returns error status on AppError', async () => {
    vi.mocked(updateListing).mockImplementation(() => { throw new NotFoundError('Not found') })
    const res = await makeApp().request('/api/admin/listings/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/listings/:id returns { ok: true } on success', async () => {
    vi.mocked(deleteListing).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/listings/apt1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/listings/:id returns error status on AppError', async () => {
    vi.mocked(deleteListing).mockImplementation(() => { throw new ConflictError('Has reservations') })
    const res = await makeApp().request('/api/admin/listings/apt1', { method: 'DELETE' })
    expect(res.status).toBe(409)
  })
})

// ── Reservations ──────────────────────────────────────────────────────────────────

describe('Reservations admin routes', () => {
  const reservationBody = {
    listingId: 'apt1', guestId: 'cli1', channelId: 'ch1',
    checkIn: '2025-06-01', checkOut: '2025-06-05',
    adultCount: 2, childrenCount: 0, totalAmountDue: 400,
  }
  const reservation = { id: 'b1', ...reservationBody, createdAt: '2025-01-01T00:00:00Z' }

  it('POST /api/admin/reservations returns 201', async () => {
    vi.mocked(createReservation).mockReturnValue(reservation as any)
    const res = await makeApp().request('/api/admin/reservations', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(reservationBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/reservations returns error on AppError', async () => {
    vi.mocked(createReservation).mockImplementation(() => { throw new ConflictError('Overlap') })
    const res = await makeApp().request('/api/admin/reservations', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(reservationBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/reservations/:id returns 200', async () => {
    vi.mocked(updateReservation).mockReturnValue(reservation as any)
    const res = await makeApp().request('/api/admin/reservations/b1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ totalAmountDue: 500 }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/reservations/:id passes no override by default', async () => {
    vi.mocked(updateReservation).mockReturnValue(reservation as any)
    await makeApp().request('/api/admin/reservations/b1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ status: 'CheckedIn' }),
    })
    expect(updateReservation).toHaveBeenCalledWith('b1', { status: 'CheckedIn' }, { override: false })
  })

  it('PATCH /api/admin/reservations/:id?override=true passes the override through', async () => {
    vi.mocked(updateReservation).mockReturnValue(reservation as any)
    const res = await makeApp().request('/api/admin/reservations/b1?override=true', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ status: 'Confirmed' }),
    })
    expect(res.status).toBe(200)
    expect(updateReservation).toHaveBeenCalledWith('b1', { status: 'Confirmed' }, { override: true })
  })

  it('PATCH /api/admin/reservations/:id returns error on AppError', async () => {
    vi.mocked(updateReservation).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/reservations/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/reservations/:id returns { ok: true }', async () => {
    vi.mocked(deleteReservation).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/reservations/b1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/reservations/:id returns error on AppError', async () => {
    vi.mocked(deleteReservation).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/reservations/ghost', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ── Guests ───────────────────────────────────────────────────────────────────

describe('Guests admin routes', () => {
  const guestBody = { name: 'Alice' }
  const guest = { id: 'cli1', ...guestBody }

  it('POST /api/admin/guests returns 201', async () => {
    vi.mocked(createGuest).mockReturnValue(guest as any)
    const res = await makeApp().request('/api/admin/guests', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(guestBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/guests returns error on AppError', async () => {
    vi.mocked(createGuest).mockImplementation(() => { throw new ConflictError('Dup doc') })
    const res = await makeApp().request('/api/admin/guests', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(guestBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/guests/:id returns 200', async () => {
    vi.mocked(updateGuest).mockReturnValue(guest as any)
    const res = await makeApp().request('/api/admin/guests/cli1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ name: 'Alicia' }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/guests/:id returns error on AppError', async () => {
    vi.mocked(updateGuest).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/guests/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/guests/:id returns { ok: true }', async () => {
    vi.mocked(deleteGuest).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/guests/cli1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/guests/:id returns error on AppError', async () => {
    vi.mocked(deleteGuest).mockImplementation(() => { throw new ConflictError('Has reservations') })
    const res = await makeApp().request('/api/admin/guests/cli1', { method: 'DELETE' })
    expect(res.status).toBe(409)
  })
})

// ── Channels ──────────────────────────────────────────────────────────────────

describe('Channels admin routes', () => {
  const channelBody = { name: 'Airbnb', commissionRate: 0.12, isActive: true }
  const channel = { id: 'ch1', ...channelBody }

  it('POST /api/admin/channels returns 201', async () => {
    vi.mocked(createChannel).mockReturnValue(channel as any)
    const res = await makeApp().request('/api/admin/channels', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(channelBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/channels returns error on AppError', async () => {
    vi.mocked(createChannel).mockImplementation(() => { throw new ConflictError('Exists') })
    const res = await makeApp().request('/api/admin/channels', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(channelBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/channels/:id returns 200', async () => {
    vi.mocked(updateChannel).mockReturnValue(channel as any)
    const res = await makeApp().request('/api/admin/channels/ch1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ commissionRate: 0.15 }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/channels/:id returns error on AppError', async () => {
    vi.mocked(updateChannel).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/channels/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/channels/:id returns { ok: true }', async () => {
    vi.mocked(deleteChannel).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/channels/ch1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/channels/:id returns error on AppError', async () => {
    vi.mocked(deleteChannel).mockImplementation(() => { throw new ConflictError('Has reservations') })
    const res = await makeApp().request('/api/admin/channels/ch1', { method: 'DELETE' })
    expect(res.status).toBe(409)
  })
})

// ── Users ─────────────────────────────────────────────────────────────────────

describe('Users admin routes', () => {
  const userItem = { id: 'admin', username: 'admin', full_name: 'Admin', isAdmin: true, enabled: true }

  it('GET /api/admin/users returns user list', async () => {
    vi.mocked(listUsers).mockReturnValue([userItem])
    const res = await makeApp().request('/api/admin/users')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([userItem])
  })

  it('POST /api/admin/users returns 201', async () => {
    vi.mocked(createUser).mockResolvedValue(userItem)
    const res = await makeApp().request('/api/admin/users', {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin', isAdmin: true }),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/users returns error on AppError', async () => {
    vi.mocked(createUser).mockRejectedValue(new ConflictError('Exists'))
    const res = await makeApp().request('/api/admin/users', {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin', isAdmin: true }),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/users/:id returns 200', async () => {
    vi.mocked(updateUser).mockResolvedValue(userItem)
    const res = await makeApp().request('/api/admin/users/admin', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ full_name: 'New Name' }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/users/:id returns error on AppError', async () => {
    vi.mocked(updateUser).mockRejectedValue(new NotFoundError())
    const res = await makeApp().request('/api/admin/users/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/users/:id returns { ok: true }', async () => {
    vi.mocked(deleteUser).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/users/uuid-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/users/:id returns error on AppError', async () => {
    vi.mocked(deleteUser).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/users/ghost', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ── Calendar Links ────────────────────────────────────────────────────────────

describe('Calendar links admin routes', () => {
  const linkBody = { channelId: 'ch1', listingId: 'apt1', url: 'https://example.com/ical.ics' }
  const link = { id: 'cl1', ...linkBody }

  it('POST /api/admin/calendar-links returns 200 with upserted link', async () => {
    vi.mocked(upsertCalendarLink).mockReturnValue(link as any)
    const res = await makeApp().request('/api/admin/calendar-links', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(linkBody),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(link)
  })

  it('POST /api/admin/calendar-links returns error status on AppError', async () => {
    vi.mocked(upsertCalendarLink).mockImplementation(() => { throw new ConflictError('Bad') })
    const res = await makeApp().request('/api/admin/calendar-links', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(linkBody),
    })
    expect(res.status).toBe(409)
  })

  it('DELETE /api/admin/calendar-links/:id returns { ok: true }', async () => {
    vi.mocked(deleteCalendarLink).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/calendar-links/cl1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/calendar-links/:id returns error on AppError', async () => {
    vi.mocked(deleteCalendarLink).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/calendar-links/ghost', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ── Metrics ───────────────────────────────────────────────────────────────────

describe('GET /api/admin/metrics', () => {
  it('returns metrics data', async () => {
    const metrics = { occupancy: [], revenue: [] }
    vi.mocked(getMetrics).mockReturnValue(metrics)
    const res = await makeApp().request('/api/admin/metrics')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(metrics)
  })

  it('returns error on AppError', async () => {
    vi.mocked(getMetrics).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/metrics')
    expect(res.status).toBe(404)
  })
})

// ── handleError non-AppError re-throw ────────────────────────────────────────

describe('handleError', () => {
  it('re-throws non-AppError exceptions (Hono returns 500)', async () => {
    vi.mocked(createListing).mockImplementation(() => { throw new Error('Unexpected!') })
    const app = makeApp()
    const res = await app.request('/api/admin/listings', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(500)
  })
})
