import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Apartment, Booking, CalendarLink, Channel, Client, Property } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/fs.js')
import { readJson, writeJson } from '../../src/infrastructure/fs.js'

import {
  loadApartments,
  loadBookings,
  loadCalendarLinks,
  loadChannels,
  loadClients,
  loadProperties,
  queryBookings,
  saveApartments,
  saveBookings,
  saveCalendarLinks,
  saveChannels,
  saveClients,
  saveProperties,
} from '../../src/infrastructure/data.js'

const booking = (id: string, apartmentId: string, from: string, to: string): Booking => ({
  id, apartmentId, clientId: 'cli1', channelId: 'ch1',
  fromDate: from, toDate: to,
  adultCount: 1, childrenCount: 0, status: 'Active', totalAmountDue: 0, createdAt: '',
})

const apt: Apartment = {
  id: 'apt1', name: 'A', address: '', floor: 1, door: 'A',
  price: 100, minNights: 1, maxGuests: 2, rooms: 1, bathrooms: 1, isAvailable: true,
}

const b1 = booking('b1', 'apt1', '2025-06-01', '2025-06-05')
const b2 = booking('b2', 'apt2', '2025-07-01', '2025-07-10')

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readJson).mockReturnValue([b1, b2])
  vi.mocked(writeJson).mockImplementation(() => undefined)
})

describe('loadApartments / saveApartments', () => {
  it('loadApartments delegates to readJson', () => {
    vi.mocked(readJson).mockReturnValue([apt])
    expect(loadApartments()).toEqual([apt])
  })
  it('saveApartments delegates to writeJson', () => {
    saveApartments([apt])
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('loadProperties / saveProperties', () => {
  it('loadProperties delegates to readJson', () => {
    const props: Property[] = [{ id: 'p1', name: 'Block' }]
    vi.mocked(readJson).mockReturnValue(props)
    expect(loadProperties()).toEqual(props)
  })
  it('saveProperties delegates to writeJson', () => {
    saveProperties([{ id: 'p1', name: 'Block' }])
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('loadBookings / saveBookings', () => {
  it('loadBookings delegates to readJson', () => {
    expect(loadBookings()).toEqual([b1, b2])
  })
  it('saveBookings delegates to writeJson', () => {
    saveBookings([b1])
    expect(writeJson).toHaveBeenCalledOnce()
  })
  it('migrates old NotPaid status to Active', () => {
    const old = { ...b1, status: 'NotPaid' }
    vi.mocked(readJson).mockReturnValue([old])
    const [result] = loadBookings()
    expect(result!.status).toBe('Active')
    expect(result!.paidDate).toBeUndefined()
  })
  it('migrates old Paid status to Active with paidDate from createdAt', () => {
    const old = { ...b1, status: 'Paid', createdAt: '2025-01-15T10:00:00Z' }
    vi.mocked(readJson).mockReturnValue([old])
    const [result] = loadBookings()
    expect(result!.status).toBe('Active')
    expect(result!.paidDate).toBe('2025-01-15')
  })
  it('migrates old Paid status preserving existing paidDate', () => {
    const old = { ...b1, status: 'Paid', paidDate: '2025-03-10', createdAt: '2025-01-15T10:00:00Z' }
    vi.mocked(readJson).mockReturnValue([old])
    const [result] = loadBookings()
    expect(result!.paidDate).toBe('2025-03-10')
  })
})

describe('loadClients / saveClients', () => {
  it('loadClients delegates to readJson', () => {
    const clients: Client[] = [{ id: 'cli1', name: 'Alice' }]
    vi.mocked(readJson).mockReturnValue(clients)
    expect(loadClients()).toEqual(clients)
  })
  it('saveClients delegates to writeJson', () => {
    saveClients([{ id: 'cli1', name: 'Alice' }])
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('loadChannels / saveChannels', () => {
  it('loadChannels delegates to readJson', () => {
    const channels: Channel[] = [{ id: 'ch1', name: 'Direct', commissionRate: 0, isActive: true }]
    vi.mocked(readJson).mockReturnValue(channels)
    expect(loadChannels()).toEqual(channels)
  })
  it('saveChannels delegates to writeJson', () => {
    saveChannels([{ id: 'ch1', name: 'Direct', commissionRate: 0, isActive: true }])
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('loadCalendarLinks / saveCalendarLinks', () => {
  it('loadCalendarLinks delegates to readJson', () => {
    const links: CalendarLink[] = [{ id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://example.com/ical' }]
    vi.mocked(readJson).mockReturnValue(links)
    expect(loadCalendarLinks()).toEqual(links)
  })
  it('saveCalendarLinks delegates to writeJson', () => {
    saveCalendarLinks([{ id: 'cl1', channelId: 'ch1', apartmentId: 'apt1', url: 'https://example.com/ical' }])
    expect(writeJson).toHaveBeenCalledOnce()
  })
})

describe('queryBookings', () => {
  it('returns all bookings when no filters', () => {
    expect(queryBookings({})).toEqual([b1, b2])
  })

  it('filters by apartmentId', () => {
    expect(queryBookings({ apartmentId: 'apt1' })).toEqual([b1])
  })

  it('filters by from + to using datesOverlap', () => {
    // b1: Jun 1–5, b2: Jul 1–10; range Jun 3–Jun 7 overlaps only b1
    const result = queryBookings({ from: '2025-06-03', to: '2025-06-07' })
    expect(result).toEqual([b1])
  })

  it('filters by from only: toDate > from', () => {
    // b1.toDate '2025-06-05' > '2025-06-10' is false; b2.toDate '2025-07-10' > '2025-06-10' is true
    const result = queryBookings({ from: '2025-06-10' })
    expect(result).toEqual([b2])
  })

  it('filters by to only: fromDate < to', () => {
    // b1.fromDate '2025-06-01' < '2025-06-15' true; b2.fromDate '2025-07-01' < '2025-06-15' false
    const result = queryBookings({ to: '2025-06-15' })
    expect(result).toEqual([b1])
  })

  it('applies apartmentId and from+to together', () => {
    const result = queryBookings({ apartmentId: 'apt1', from: '2025-06-03', to: '2025-06-07' })
    expect(result).toEqual([b1])
  })
})
