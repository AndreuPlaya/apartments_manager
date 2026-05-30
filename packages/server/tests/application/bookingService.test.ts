import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Apartment, Booking, Channel, Client } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/data.js')
import {
  loadApartments,
  loadBookings,
  loadChannels,
  loadClients,
  queryBookings,
  saveBookings,
} from '../../src/infrastructure/data.js'

import { createBooking, deleteBooking, listBookings, patchBookingFields, updateBooking } from '../../src/application/bookingService.js'

const apt: Apartment = {
  id: 'apt1',
  name: 'Beach House',
  address: '1 Ocean Ave',
  floor: 1,
  door: 'A',
  price: 100,
  minNights: 2,
  maxGuests: 4,
  rooms: 2,
  bathrooms: 1,
  isAvailable: true,
}

const client: Client = {
  id: 'cli1',
  name: 'Alice',
}

const channel: Channel = {
  id: 'ch1',
  name: 'Direct',
  commissionRate: 0,
  isActive: true,
}

const validReq = {
  apartmentId: 'apt1',
  clientId: 'cli1',
  channelId: 'ch1',
  fromDate: '2025-06-01',
  toDate: '2025-06-05',
  adultCount: 2,
  childrenCount: 0,
  status: 'Active' as const,
  totalAmountDue: 400,
}

beforeEach(() => {
  vi.mocked(loadApartments).mockReturnValue([apt])
  vi.mocked(loadClients).mockReturnValue([client])
  vi.mocked(loadChannels).mockReturnValue([channel])
  vi.mocked(loadBookings).mockReturnValue([])
  vi.mocked(saveBookings).mockImplementation(() => undefined)
  vi.mocked(queryBookings).mockReturnValue([])
})

describe('listBookings', () => {
  it('delegates to queryBookings and returns its result', () => {
    const b: Booking = {
      id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
      fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
      status: 'Active', totalAmountDue: 400, createdAt: '2025-01-01T00:00:00Z',
    }
    vi.mocked(queryBookings).mockReturnValue([b])
    const result = listBookings({ apartmentId: 'apt1' })
    expect(result).toEqual([b])
    expect(queryBookings).toHaveBeenCalledWith({ apartmentId: 'apt1' })
  })
})

describe('createBooking', () => {
  it('creates a valid booking with generated id and createdAt', () => {
    const result = createBooking(validReq)
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.fromDate).toBe('2025-06-01')
    expect(result.toDate).toBe('2025-06-05')
    expect(saveBookings).toHaveBeenCalledOnce()
  })

  it('strips time component from dates', () => {
    const result = createBooking({ ...validReq, fromDate: '2025-06-01T12:00:00Z', toDate: '2025-06-05T12:00:00Z' })
    expect(result.fromDate).toBe('2025-06-01')
    expect(result.toDate).toBe('2025-06-05')
  })

  it('throws ValidationError when toDate <= fromDate', () => {
    expect(() => createBooking({ ...validReq, toDate: '2025-06-01' })).toThrow('toDate must be after fromDate')
  })

  it('throws ValidationError when minNights not met (1 night, min 2)', () => {
    expect(() => createBooking({ ...validReq, toDate: '2025-06-02' })).toThrow('Minimum 2 night')
  })

  it('throws ValidationError for non-existent apartment', () => {
    vi.mocked(loadApartments).mockReturnValue([])
    expect(() => createBooking(validReq)).toThrow("not found")
  })

  it('throws ValidationError for unavailable apartment', () => {
    vi.mocked(loadApartments).mockReturnValue([{ ...apt, isAvailable: false }])
    expect(() => createBooking(validReq)).toThrow('not available')
  })

  it('throws ValidationError for non-existent client', () => {
    vi.mocked(loadClients).mockReturnValue([])
    expect(() => createBooking(validReq)).toThrow("not found")
  })

  it('throws ValidationError for non-existent channel', () => {
    vi.mocked(loadChannels).mockReturnValue([])
    expect(() => createBooking(validReq)).toThrow("not found")
  })

  it('throws ValidationError for inactive channel', () => {
    vi.mocked(loadChannels).mockReturnValue([{ ...channel, isActive: false }])
    expect(() => createBooking(validReq)).toThrow('not active')
  })

  it('throws ConflictError when dates overlap an existing booking', () => {
    const existing: Booking = {
      id: 'b-existing',
      apartmentId: 'apt1',
      clientId: 'cli1',
      channelId: 'ch1',
      fromDate: '2025-06-03',
      toDate: '2025-06-08',
      adultCount: 1,
      childrenCount: 0,
      status: 'Active',
      totalAmountDue: 500,
      createdAt: '2025-01-01T00:00:00Z',
    }
    vi.mocked(loadBookings).mockReturnValue([existing])
    expect(() => createBooking(validReq)).toThrow('overlap')
  })

  it('does NOT throw when new checkin equals existing checkout (adjacent)', () => {
    const existing: Booking = {
      id: 'b-existing',
      apartmentId: 'apt1',
      clientId: 'cli1',
      channelId: 'ch1',
      fromDate: '2025-05-28',
      toDate: '2025-06-01',
      adultCount: 1,
      childrenCount: 0,
      status: 'Active',
      totalAmountDue: 300,
      createdAt: '2025-01-01T00:00:00Z',
    }
    vi.mocked(loadBookings).mockReturnValue([existing])
    expect(() => createBooking(validReq)).not.toThrow()
  })
})

describe('updateBooking', () => {
  const existingBooking: Booking = {
    id: 'b1',
    apartmentId: 'apt1',
    clientId: 'cli1',
    channelId: 'ch1',
    fromDate: '2025-06-01',
    toDate: '2025-06-05',
    adultCount: 2,
    childrenCount: 0,
    status: 'Active',
    totalAmountDue: 400,
    createdAt: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.mocked(loadBookings).mockReturnValue([existingBooking])
  })

  it('updates non-date fields without re-validating dates', () => {
    const result = updateBooking('b1', { totalAmountDue: 500 })
    expect(result.totalAmountDue).toBe(500)
    expect(result.fromDate).toBe('2025-06-01')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateBooking('does-not-exist', {})).toThrow('not found')
  })

  it('excludes self when checking overlap during date update', () => {
    // Updating fromDate to same range should not conflict with itself
    const result = updateBooking('b1', { fromDate: '2025-06-02' })
    expect(result.fromDate).toBe('2025-06-02')
  })

  it('throws ConflictError when updated dates overlap another booking', () => {
    const other: Booking = {
      ...existingBooking,
      id: 'b2',
      fromDate: '2025-06-08',
      toDate: '2025-06-12',
    }
    vi.mocked(loadBookings).mockReturnValue([existingBooking, other])
    expect(() => updateBooking('b1', { toDate: '2025-06-10' })).toThrow('overlap')
  })

  it('throws ValidationError when updated dates are invalid (toDate <= fromDate)', () => {
    expect(() => updateBooking('b1', { toDate: '2025-05-31' })).toThrow('toDate must be after fromDate')
  })

  it('throws ValidationError when updated apartment not found', () => {
    vi.mocked(loadApartments).mockReturnValue([])
    expect(() => updateBooking('b1', { apartmentId: 'no-such-apt' })).toThrow('not found')
  })

  it('throws ValidationError when updated apartment is unavailable', () => {
    vi.mocked(loadApartments).mockReturnValue([{ ...apt, isAvailable: false }])
    expect(() => updateBooking('b1', { apartmentId: 'apt1' })).toThrow('not available')
  })

  it('throws ValidationError when minNights not met after date change', () => {
    expect(() => updateBooking('b1', { toDate: '2025-06-02' })).toThrow('Minimum')
  })

  it('validates channelId when updating channel', () => {
    expect(() => updateBooking('b1', { channelId: 'no-such-ch' })).toThrow('not found')
  })

  it('throws ValidationError when updated channel is inactive', () => {
    vi.mocked(loadChannels).mockReturnValue([{ ...channel, isActive: false }])
    expect(() => updateBooking('b1', { channelId: 'ch1' })).toThrow('not active')
  })

  it('validates clientId when updating client', () => {
    vi.mocked(loadClients).mockReturnValue([])
    expect(() => updateBooking('b1', { clientId: 'no-such-cli' })).toThrow('not found')
  })
})

describe('deleteBooking', () => {
  it('removes an existing booking', () => {
    const b: Booking = {
      id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
      fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
      status: 'Active', totalAmountDue: 0, createdAt: '',
    }
    vi.mocked(loadBookings).mockReturnValue([b])
    deleteBooking('b1')
    expect(saveBookings).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for unknown id', () => {
    vi.mocked(loadBookings).mockReturnValue([])
    expect(() => deleteBooking('ghost')).toThrow('not found')
  })
})

describe('patchBookingFields', () => {
  const existing: Booking = {
    id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
    fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
    status: 'Active', totalAmountDue: 0, createdAt: '',
  }

  beforeEach(() => {
    vi.mocked(loadBookings).mockReturnValue([existing])
  })

  it('patches comment only', () => {
    const result = patchBookingFields('b1', { comment: 'hello' })
    expect(result.comment).toBe('hello')
    expect(result.status).toBe('Active')
    expect(saveBookings).toHaveBeenCalled()
  })

  it('patches status only', () => {
    const result = patchBookingFields('b1', { status: 'Cancelled' })
    expect(result.status).toBe('Cancelled')
    expect(result.comment).toBeUndefined()
  })

  it('patches paidDate only', () => {
    const result = patchBookingFields('b1', { paidDate: '2025-06-02' })
    expect(result.paidDate).toBe('2025-06-02')
  })

  it('patches multiple fields at once', () => {
    const result = patchBookingFields('b1', { comment: 'hi', paidDate: '2025-06-03', status: 'Cancelled' })
    expect(result.comment).toBe('hi')
    expect(result.paidDate).toBe('2025-06-03')
    expect(result.status).toBe('Cancelled')
  })

  it('throws NotFoundError for unknown id', () => {
    vi.mocked(loadBookings).mockReturnValue([])
    expect(() => patchBookingFields('ghost', { comment: 'x' })).toThrow('not found')
  })
})
