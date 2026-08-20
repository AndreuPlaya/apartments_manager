import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApartment,
  deleteApartment,
  listApartments,
  updateApartment,
} from '../../src/application/apartmentService.js'
import * as apartments from '../../src/infrastructure/repositories/apartments.js'
import { APARTMENT, seedBase, seedBooking, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
})

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

describe('listApartments', () => {
  it('returns the stored apartments', () => {
    expect(listApartments()).toEqual([APARTMENT])
  })
})

describe('createApartment', () => {
  it('creates an apartment with a generated id and persists it', () => {
    const result = createApartment(req)

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Mountain Cabin')
    expect(listApartments()).toHaveLength(2)
  })

  it('round-trips optional fields', () => {
    const result = createApartment({ ...req, description: 'Cosy' })

    expect(apartments.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createApartment({ ...req, name: 'beach house' })).toThrow('already exists')
    expect(listApartments()).toHaveLength(1)
  })
})

describe('updateApartment', () => {
  it('updates an apartment successfully', () => {
    const result = updateApartment('apt1', { price: 120 })

    expect(result.price).toBe(120)
    expect(result.name).toBe('Beach House')
    expect(apartments.findById('apt1')!.price).toBe(120)
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateApartment('no-such', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    apartments.insert({ ...APARTMENT, id: 'apt2', name: 'Villa' })

    expect(() => updateApartment('apt1', { name: 'villa' })).toThrow('already exists')
    expect(apartments.findById('apt1')!.name).toBe('Beach House')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    expect(updateApartment('apt1', { name: 'Beach House' }).name).toBe('Beach House')
  })
})

describe('deleteApartment', () => {
  it('deletes an apartment with no bookings', () => {
    deleteApartment('apt1')

    expect(listApartments()).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteApartment('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the apartment has existing bookings', () => {
    seedBooking()

    expect(() => deleteApartment('apt1')).toThrow('existing bookings')
    expect(listApartments()).toHaveLength(1)
  })
})
