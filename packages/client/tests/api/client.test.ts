import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from '../../src/api/client'

function mockFetch(status: number, body: unknown, contentType = 'application/json') {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Status Text',
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyStr),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ApiError', () => {
  it('stores status and message', () => {
    const err = new ApiError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('request()', () => {
  it('returns parsed JSON for a 2xx response with JSON content-type', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { data: 1 }))
    const result = await api.apartments.list()
    expect(result).toEqual({ data: 1 })
  })

  it('returns undefined for a 2xx response without JSON content-type', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    const result = await api.auth.logout()
    expect(result).toBeUndefined()
  })

  it('throws ApiError for a non-2xx response with JSON error field', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { error: 'Bad request' }))
    await expect(api.apartments.list()).rejects.toThrow('Bad request')
    await expect(api.apartments.list()).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError with status set correctly', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { error: 'Not found' }))
    try {
      await api.apartments.list()
    } catch (e) {
      expect((e as ApiError).status).toBe(404)
    }
  })

  it('uses raw text when JSON parse fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('not json'),
    }))
    await expect(api.apartments.list()).rejects.toThrow('not json')
  })

  it('uses raw text when JSON has no error field', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { message: 'Bad request' }))
    await expect(api.apartments.list()).rejects.toThrow('{"message":"Bad request"}')
  })

  it('returns undefined for a 2xx response with null content-type header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
    }))
    const result = await api.apartments.list()
    expect(result).toBeUndefined()
  })

  it('uses statusText when text() throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: { get: () => 'application/json' },
      text: () => Promise.reject(new Error('body error')),
    }))
    await expect(api.apartments.list()).rejects.toThrow('Service Unavailable')
  })
})

describe('api.bookings.list()', () => {
  it('uses no query string when no params', async () => {
    const fetchMock = mockFetch(200, [])
    vi.stubGlobal('fetch', fetchMock)
    await api.bookings.list()
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/bookings')
  })

  it('appends apartmentId to query string', async () => {
    const fetchMock = mockFetch(200, [])
    vi.stubGlobal('fetch', fetchMock)
    await api.bookings.list({ apartmentId: 'apt1' })
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/bookings?apartmentId=apt1')
  })

  it('appends from and to to query string', async () => {
    const fetchMock = mockFetch(200, [])
    vi.stubGlobal('fetch', fetchMock)
    await api.bookings.list({ from: '2025-06-01', to: '2025-06-30' })
    expect(fetchMock.mock.calls[0]![0]).toContain('from=2025-06-01')
    expect(fetchMock.mock.calls[0]![0]).toContain('to=2025-06-30')
  })

  it('appends all three params together', async () => {
    const fetchMock = mockFetch(200, [])
    vi.stubGlobal('fetch', fetchMock)
    await api.bookings.list({ apartmentId: 'apt1', from: '2025-06-01', to: '2025-06-30' })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain('apartmentId=apt1')
    expect(url).toContain('from=2025-06-01')
    expect(url).toContain('to=2025-06-30')
  })
})

describe('api.auth.config()', () => {
  it('returns the response JSON directly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true, is_admin: false, username: 'alice' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await api.auth.config()
    expect(result).toEqual({ ok: true, is_admin: false, username: 'alice' })
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/config', { credentials: 'same-origin' })
  })
})

describe('api.auth.login()', () => {
  it('posts to /api/auth/login and returns response', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { ok: true, is_admin: true, username: 'admin' }))
    const result = await api.auth.login({ username: 'admin', password: 'pass' })
    expect(result.ok).toBe(true)
  })
})

describe('api.auth.setup()', () => {
  it('posts to /api/auth/setup and returns response', async () => {
    vi.stubGlobal('fetch', mockFetch(201, { ok: true }))
    const result = await api.auth.setup({ username: 'admin', password: 'pass12345', full_name: 'Admin' })
    expect(result.ok).toBe(true)
  })
})

describe('api.apartments.*', () => {
  const aptBody = { name: 'A', address: '1 St', floor: 1, door: 'A', price: 100, minNights: 1, maxGuests: 2, rooms: 1, bathrooms: 1, isAvailable: true }
  const apt = { id: 'apt1', ...aptBody }
  it('create posts to /api/admin/apartments', async () => {
    vi.stubGlobal('fetch', mockFetch(201, apt))
    expect(await api.apartments.create(aptBody)).toEqual(apt)
  })
  it('update patches /api/admin/apartments/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, apt))
    expect(await api.apartments.update('apt1', { price: 120 })).toEqual(apt)
  })
  it('delete sends DELETE to /api/admin/apartments/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    await expect(api.apartments.delete('apt1')).resolves.toBeUndefined()
  })
})

describe('api.bookings.*', () => {
  const bookingBody = { apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1', fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 2, childrenCount: 0, status: 'Active' as const, totalAmountDue: 400 }
  const booking = { id: 'b1', ...bookingBody, createdAt: '2025-01-01T00:00:00Z' }
  it('create posts to /api/admin/bookings', async () => {
    vi.stubGlobal('fetch', mockFetch(201, booking))
    expect(await api.bookings.create(bookingBody)).toEqual(booking)
  })
  it('update patches /api/admin/bookings/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, booking))
    expect(await api.bookings.update('b1', { totalAmountDue: 500 })).toEqual(booking)
  })
  it('patch sends PATCH to /api/bookings/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, booking))
    expect(await api.bookings.patch('b1', { comment: 'hi', paidDate: '2025-06-02' })).toEqual(booking)
  })
  it('delete sends DELETE to /api/admin/bookings/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    await expect(api.bookings.delete('b1')).resolves.toBeUndefined()
  })
})

describe('api.clients.*', () => {
  const clientBody = { name: 'Alice' }
  const client = { id: 'cli1', ...clientBody }
  it('list fetches /api/clients', async () => {
    vi.stubGlobal('fetch', mockFetch(200, [client]))
    expect(await api.clients.list()).toEqual([client])
  })
  it('create posts to /api/admin/clients', async () => {
    vi.stubGlobal('fetch', mockFetch(201, client))
    expect(await api.clients.create(clientBody)).toEqual(client)
  })
  it('update patches /api/admin/clients/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, client))
    expect(await api.clients.update('cli1', { name: 'Alicia' })).toEqual(client)
  })
  it('delete sends DELETE to /api/admin/clients/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    await expect(api.clients.delete('cli1')).resolves.toBeUndefined()
  })
})

describe('api.channels.*', () => {
  const channelBody = { name: 'Airbnb', commissionRate: 0.12, isActive: true }
  const channel = { id: 'ch1', ...channelBody }
  it('list fetches /api/channels', async () => {
    vi.stubGlobal('fetch', mockFetch(200, [channel]))
    expect(await api.channels.list()).toEqual([channel])
  })
  it('create posts to /api/admin/channels', async () => {
    vi.stubGlobal('fetch', mockFetch(201, channel))
    expect(await api.channels.create(channelBody)).toEqual(channel)
  })
  it('update patches /api/admin/channels/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, channel))
    expect(await api.channels.update('ch1', { commissionRate: 0.15 })).toEqual(channel)
  })
  it('delete sends DELETE to /api/admin/channels/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    await expect(api.channels.delete('ch1')).resolves.toBeUndefined()
  })
})

describe('api.users.*', () => {
  const userItem = { id: 'uuid-1', username: 'alice', full_name: 'Alice', isAdmin: false, enabled: true }
  it('list fetches /api/admin/users', async () => {
    vi.stubGlobal('fetch', mockFetch(200, [userItem]))
    expect(await api.users.list()).toEqual([userItem])
  })
  it('create posts to /api/admin/users', async () => {
    vi.stubGlobal('fetch', mockFetch(201, userItem))
    expect(await api.users.create({ username: 'alice', password: 'pass', full_name: 'Alice', isAdmin: false })).toEqual(userItem)
  })
  it('update patches /api/admin/users/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, userItem))
    expect(await api.users.update('uuid-1', { enabled: false })).toEqual(userItem)
  })
  it('delete sends DELETE to /api/admin/users/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, '', 'text/plain'))
    await expect(api.users.delete('uuid-1')).resolves.toBeUndefined()
  })
})

describe('api.calendarLinks.*', () => {
  const linkBody = { channelId: 'ch1', apartmentId: 'apt1', url: 'https://example.com/ical.ics' }
  const link = { id: 'cl1', ...linkBody }
  it('list fetches /api/calendar-links', async () => {
    const fetchMock = mockFetch(200, [link])
    vi.stubGlobal('fetch', fetchMock)
    expect(await api.calendarLinks.list()).toEqual([link])
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/calendar-links')
  })
  it('upsert posts to /api/admin/calendar-links', async () => {
    const fetchMock = mockFetch(200, link)
    vi.stubGlobal('fetch', fetchMock)
    expect(await api.calendarLinks.upsert(linkBody)).toEqual(link)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/admin/calendar-links')
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'POST' })
  })
  it('delete sends DELETE to /api/admin/calendar-links/:id', async () => {
    const fetchMock = mockFetch(200, '', 'text/plain')
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.calendarLinks.delete('cl1')).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/admin/calendar-links/cl1')
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'DELETE' })
  })
})

describe('api.metrics.*', () => {
  it('get fetches /api/admin/metrics', async () => {
    const metrics = { occupancy: [], revenue: [] }
    vi.stubGlobal('fetch', mockFetch(200, metrics))
    expect(await api.metrics.get()).toEqual(metrics)
  })
})
