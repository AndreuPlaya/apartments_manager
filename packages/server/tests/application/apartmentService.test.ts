import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Apartment, Booking } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/data.js')
import {
  loadApartments,
  loadBookings,
  saveApartments,
} from '../../src/infrastructure/data.js'

import {
  createApartment,
  deleteApartment,
  listApartments,
  updateApartment,
} from '../../src/application/apartmentService.js'

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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadApartments).mockReturnValue([apt])
  vi.mocked(loadBookings).mockReturnValue([])
  vi.mocked(saveApartments).mockImplementation(() => undefined)
})

describe('listApartments', () => {
  it('returns what loadApartments returns', () => {
    expect(listApartments()).toEqual([apt])
  })
})

describe('createApartment', () => {
  const req = {
    name: 'Mountain Cabin',
    address: '1 Hill Rd',
    floor: 2,
    door: 'B',
    price: 80,
    minNights: 1,
    maxGuests: 2,
    rooms: 1,
    bathrooms: 1,
    isAvailable: true,
  }

  it('creates an apartment with a generated id', () => {
    const result = createApartment(req)
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Mountain Cabin')
    expect(saveApartments).toHaveBeenCalledOnce()
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createApartment({ ...req, name: 'beach house' })).toThrow('already exists')
  })
})

describe('updateApartment', () => {
  it('updates an apartment successfully', () => {
    const result = updateApartment('apt1', { price: 120 })
    expect(result.price).toBe(120)
    expect(result.name).toBe('Beach House')
    expect(saveApartments).toHaveBeenCalledOnce()
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateApartment('no-such', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    vi.mocked(loadApartments).mockReturnValue([
      apt,
      { ...apt, id: 'apt2', name: 'Villa' },
    ])
    expect(() => updateApartment('apt1', { name: 'villa' })).toThrow('already exists')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    const result = updateApartment('apt1', { name: 'Beach House' })
    expect(result.name).toBe('Beach House')
  })
})

describe('deleteApartment', () => {
  it('deletes an apartment with no bookings', () => {
    deleteApartment('apt1')
    expect(saveApartments).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteApartment('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the apartment has existing bookings', () => {
    const booking: Booking = {
      id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
      fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
      status: 'Active', totalAmountDue: 400, createdAt: '',
    }
    vi.mocked(loadBookings).mockReturnValue([booking])
    expect(() => deleteApartment('apt1')).toThrow('existing bookings')
  })
})
