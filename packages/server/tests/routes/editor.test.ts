import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: async (_c: any, next: any) => { await next() },
}))
vi.mock('../../src/application/apartmentService.js')
vi.mock('../../src/application/propertyService.js')
vi.mock('../../src/application/bookingService.js')
vi.mock('../../src/application/clientService.js')
vi.mock('../../src/application/channelService.js')
vi.mock('../../src/application/calendarLinkService.js')

import { listApartments } from '../../src/application/apartmentService.js'
import { listBookings, patchBookingFields } from '../../src/application/bookingService.js'
import { listCalendarLinks } from '../../src/application/calendarLinkService.js'
import { listChannels } from '../../src/application/channelService.js'
import { listClients } from '../../src/application/clientService.js'
import { listProperties } from '../../src/application/propertyService.js'
import { NotFoundError } from '../../src/application/errors.js'

import editorRoutes from '../../src/routes/editor.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listApartments).mockReturnValue([])
  vi.mocked(listProperties).mockReturnValue([])
  vi.mocked(listBookings).mockReturnValue([])
  vi.mocked(listClients).mockReturnValue([])
  vi.mocked(listChannels).mockReturnValue([])
  vi.mocked(listCalendarLinks).mockReturnValue([])
  vi.mocked(patchBookingFields).mockReturnValue({ id: 'b1' } as any)
})

function makeApp() {
  const app = new Hono()
  app.route('/', editorRoutes)
  return app
}

describe('GET /api/apartments', () => {
  it('returns apartment list', async () => {
    vi.mocked(listApartments).mockReturnValue([{ id: 'apt1' } as any])
    const res = await makeApp().request('/api/apartments')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([{ id: 'apt1' }])
  })
})

describe('GET /api/properties', () => {
  it('returns property list', async () => {
    vi.mocked(listProperties).mockReturnValue([{ id: 'p1' } as any])
    const res = await makeApp().request('/api/properties')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'p1' }])
  })
})

describe('GET /api/bookings', () => {
  it('calls listBookings with no filters when no query params', async () => {
    const res = await makeApp().request('/api/bookings')
    expect(res.status).toBe(200)
    expect(listBookings).toHaveBeenCalledWith({ apartmentId: undefined, from: undefined, to: undefined })
  })

  it('passes query params as filters', async () => {
    await makeApp().request('/api/bookings?apartmentId=apt1&from=2025-06-01&to=2025-06-30')
    expect(listBookings).toHaveBeenCalledWith({ apartmentId: 'apt1', from: '2025-06-01', to: '2025-06-30' })
  })
})

describe('GET /api/clients', () => {
  it('returns client list', async () => {
    vi.mocked(listClients).mockReturnValue([{ id: 'cli1', name: 'Alice' } as any])
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
    vi.mocked(listCalendarLinks).mockReturnValue([{ id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://x' } as any])
    const res = await makeApp().request('/api/calendar-links')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://x' }])
  })
})

describe('PATCH /api/bookings/:id', () => {
  const patch = (body: object) =>
    makeApp().request('/api/bookings/b1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('patches a booking and returns the updated record', async () => {
    const updated = { id: 'b1', comment: 'hi', paidDate: '2025-06-02', status: 'Cancelled' }
    vi.mocked(patchBookingFields).mockReturnValue(updated as any)
    const res = await patch({ comment: 'hi', paidDate: '2025-06-02', status: 'Cancelled' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
    expect(patchBookingFields).toHaveBeenCalledWith('b1', { comment: 'hi', paidDate: '2025-06-02', status: 'Cancelled' })
  })

  it('returns 404 json when service throws an AppError', async () => {
    vi.mocked(patchBookingFields).mockImplementation(() => { throw new NotFoundError("Booking 'b1' not found") })
    const res = await patch({})
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Booking 'b1' not found" })
  })

  it('re-throws non-AppError errors (Hono returns 500)', async () => {
    vi.mocked(patchBookingFields).mockImplementation(() => { throw new Error('unexpected') })
    const res = await patch({})
    expect(res.status).toBe(500)
  })
})
