import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: async (_c: any, next: any) => { await next() },
}))
vi.mock('../middleware/admin.js', () => ({
  adminMiddleware: async (_c: any, next: any) => { await next() },
}))
vi.mock('../application/apartmentService.js')
vi.mock('../application/bookingService.js')
vi.mock('../application/channelService.js')
vi.mock('../application/clientService.js')
vi.mock('../application/metricsService.js')
vi.mock('../application/propertyService.js')
vi.mock('../application/userService.js')

import { createApartment, deleteApartment, updateApartment } from '../application/apartmentService.js'
import { createBooking, deleteBooking, updateBooking } from '../application/bookingService.js'
import { createChannel, deleteChannel, updateChannel } from '../application/channelService.js'
import { createClient, deleteClient, updateClient } from '../application/clientService.js'
import { getMetrics } from '../application/metricsService.js'
import { createProperty, deleteProperty, updateProperty } from '../application/propertyService.js'
import { createUser, deleteUser, listUsers, updateUser } from '../application/userService.js'
import { ConflictError, NotFoundError } from '../application/errors.js'

import adminRoutes from './admin.js'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

beforeEach(() => {
  vi.clearAllMocks()
})

function makeApp() {
  const app = new Hono()
  app.route('/', adminRoutes)
  return app
}

// ── Apartments ────────────────────────────────────────────────────────────────

describe('Apartments admin routes', () => {
  const aptBody = {
    name: 'Beach House', address: '1 Ocean', floor: 1, door: 'A',
    price: 100, minNights: 2, maxGuests: 4, rooms: 2, bathrooms: 1, isAvailable: true,
  }
  const apt = { id: 'apt1', ...aptBody }

  it('POST /api/admin/apartments returns 201 on success', async () => {
    vi.mocked(createApartment).mockReturnValue(apt as any)
    const res = await makeApp().request('/api/admin/apartments', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(aptBody),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(apt)
  })

  it('POST /api/admin/apartments returns error status on AppError', async () => {
    vi.mocked(createApartment).mockImplementation(() => { throw new ConflictError('Already exists') })
    const res = await makeApp().request('/api/admin/apartments', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(aptBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/apartments/:id returns 200 on success', async () => {
    vi.mocked(updateApartment).mockReturnValue(apt as any)
    const res = await makeApp().request('/api/admin/apartments/apt1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ price: 120 }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/apartments/:id returns error status on AppError', async () => {
    vi.mocked(updateApartment).mockImplementation(() => { throw new NotFoundError('Not found') })
    const res = await makeApp().request('/api/admin/apartments/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/apartments/:id returns { ok: true } on success', async () => {
    vi.mocked(deleteApartment).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/apartments/apt1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/apartments/:id returns error status on AppError', async () => {
    vi.mocked(deleteApartment).mockImplementation(() => { throw new ConflictError('Has bookings') })
    const res = await makeApp().request('/api/admin/apartments/apt1', { method: 'DELETE' })
    expect(res.status).toBe(409)
  })
})

// ── Properties ────────────────────────────────────────────────────────────────

describe('Properties admin routes', () => {
  const propBody = { name: 'Block A' }
  const prop = { id: 'p1', ...propBody }

  it('POST /api/admin/properties returns 201', async () => {
    vi.mocked(createProperty).mockReturnValue(prop as any)
    const res = await makeApp().request('/api/admin/properties', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(propBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/properties returns error on AppError', async () => {
    vi.mocked(createProperty).mockImplementation(() => { throw new ConflictError('Exists') })
    const res = await makeApp().request('/api/admin/properties', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(propBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/properties/:id returns 200', async () => {
    vi.mocked(updateProperty).mockReturnValue(prop as any)
    const res = await makeApp().request('/api/admin/properties/p1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ name: 'Block B' }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/properties/:id returns error on AppError', async () => {
    vi.mocked(updateProperty).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/properties/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/properties/:id returns { ok: true }', async () => {
    vi.mocked(deleteProperty).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/properties/p1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/properties/:id returns error on AppError', async () => {
    vi.mocked(deleteProperty).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/properties/ghost', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ── Bookings ──────────────────────────────────────────────────────────────────

describe('Bookings admin routes', () => {
  const bookingBody = {
    apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
    fromDate: '2025-06-01', toDate: '2025-06-05',
    adultCount: 2, childrenCount: 0, status: 'NotPaid', totalAmountDue: 400,
  }
  const booking = { id: 'b1', ...bookingBody, createdAt: '2025-01-01T00:00:00Z' }

  it('POST /api/admin/bookings returns 201', async () => {
    vi.mocked(createBooking).mockReturnValue(booking as any)
    const res = await makeApp().request('/api/admin/bookings', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(bookingBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/bookings returns error on AppError', async () => {
    vi.mocked(createBooking).mockImplementation(() => { throw new ConflictError('Overlap') })
    const res = await makeApp().request('/api/admin/bookings', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(bookingBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/bookings/:id returns 200', async () => {
    vi.mocked(updateBooking).mockReturnValue(booking as any)
    const res = await makeApp().request('/api/admin/bookings/b1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ totalAmountDue: 500 }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/bookings/:id returns error on AppError', async () => {
    vi.mocked(updateBooking).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/bookings/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/bookings/:id returns { ok: true }', async () => {
    vi.mocked(deleteBooking).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/bookings/b1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/bookings/:id returns error on AppError', async () => {
    vi.mocked(deleteBooking).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/bookings/ghost', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

// ── Clients ───────────────────────────────────────────────────────────────────

describe('Clients admin routes', () => {
  const clientBody = { name: 'Alice' }
  const client = { id: 'cli1', ...clientBody }

  it('POST /api/admin/clients returns 201', async () => {
    vi.mocked(createClient).mockReturnValue(client as any)
    const res = await makeApp().request('/api/admin/clients', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(clientBody),
    })
    expect(res.status).toBe(201)
  })

  it('POST /api/admin/clients returns error on AppError', async () => {
    vi.mocked(createClient).mockImplementation(() => { throw new ConflictError('Dup doc') })
    const res = await makeApp().request('/api/admin/clients', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(clientBody),
    })
    expect(res.status).toBe(409)
  })

  it('PATCH /api/admin/clients/:id returns 200', async () => {
    vi.mocked(updateClient).mockReturnValue(client as any)
    const res = await makeApp().request('/api/admin/clients/cli1', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ name: 'Alicia' }),
    })
    expect(res.status).toBe(200)
  })

  it('PATCH /api/admin/clients/:id returns error on AppError', async () => {
    vi.mocked(updateClient).mockImplementation(() => { throw new NotFoundError() })
    const res = await makeApp().request('/api/admin/clients/ghost', {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/clients/:id returns { ok: true }', async () => {
    vi.mocked(deleteClient).mockImplementation(() => undefined)
    const res = await makeApp().request('/api/admin/clients/cli1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('DELETE /api/admin/clients/:id returns error on AppError', async () => {
    vi.mocked(deleteClient).mockImplementation(() => { throw new ConflictError('Has bookings') })
    const res = await makeApp().request('/api/admin/clients/cli1', { method: 'DELETE' })
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
    vi.mocked(deleteChannel).mockImplementation(() => { throw new ConflictError('Has bookings') })
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
    vi.mocked(createApartment).mockImplementation(() => { throw new Error('Unexpected!') })
    const app = makeApp()
    const res = await app.request('/api/admin/apartments', {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({}),
    })
    expect(res.status).toBe(500)
  })
})
