import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: async (_c: any, next: any) => { await next() },
}))
vi.mock('../application/apartmentService.js')
vi.mock('../application/propertyService.js')
vi.mock('../application/bookingService.js')
vi.mock('../application/clientService.js')
vi.mock('../application/channelService.js')

import { listApartments } from '../application/apartmentService.js'
import { listBookings } from '../application/bookingService.js'
import { listChannels } from '../application/channelService.js'
import { listClients } from '../application/clientService.js'
import { listProperties } from '../application/propertyService.js'

import editorRoutes from './editor.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listApartments).mockReturnValue([])
  vi.mocked(listProperties).mockReturnValue([])
  vi.mocked(listBookings).mockReturnValue([])
  vi.mocked(listClients).mockReturnValue([])
  vi.mocked(listChannels).mockReturnValue([])
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
