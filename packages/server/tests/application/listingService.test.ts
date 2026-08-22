import { beforeEach, describe, expect, it } from 'vitest'
import {
  createListing,
  deleteListing,
  listListings,
  updateListing,
} from '../../src/application/listingService.js'
import * as listings from '../../src/infrastructure/repositories/listings.js'
import { LISTING, seedBase, seedReservation, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
})

const req = {
  name: 'Mountain Cabin',
  address: '1 Hill Rd',
  floor: 2,
  door: 'B',
  nightlyRate: 80,
  minNights: 1,
  maxAdults: 2,
  rooms: 1,
  bathrooms: 1,
  isActive: true,
}

describe('listListings', () => {
  it('returns the stored listings', () => {
    expect(listListings()).toEqual([LISTING])
  })
})

describe('createListing', () => {
  it('creates an listing with a generated id and persists it', () => {
    const result = createListing(req)

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Mountain Cabin')
    expect(listListings()).toHaveLength(2)
  })

  it('round-trips optional fields', () => {
    const result = createListing({ ...req, description: 'Cosy' })

    expect(listings.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createListing({ ...req, name: 'beach house' })).toThrow('already exists')
    expect(listListings()).toHaveLength(1)
  })
})

describe('updateListing', () => {
  it('updates an listing successfully', () => {
    const result = updateListing('apt1', { nightlyRate: 120 })

    expect(result.nightlyRate).toBe(120)
    expect(result.name).toBe('Beach House')
    expect(listings.findById('apt1')!.nightlyRate).toBe(120)
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateListing('no-such', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    listings.insert({ ...LISTING, id: 'apt2', name: 'Villa' })

    expect(() => updateListing('apt1', { name: 'villa' })).toThrow('already exists')
    expect(listings.findById('apt1')!.name).toBe('Beach House')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    expect(updateListing('apt1', { name: 'Beach House' }).name).toBe('Beach House')
  })
})

describe('deleteListing', () => {
  it('deletes a listing with no reservations', () => {
    deleteListing('apt1')

    expect(listListings()).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteListing('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the listing has existing reservations', () => {
    seedReservation()

    expect(() => deleteListing('apt1')).toThrow('existing reservations')
    expect(listListings()).toHaveLength(1)
  })
})
