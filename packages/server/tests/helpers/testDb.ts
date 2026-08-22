import { afterEach, beforeEach } from 'vitest'
import type { Listing, Reservation, Channel, Guest } from '../../src/domain/models.js'
import { closeDb, openDatabase, useDatabase } from '../../src/infrastructure/db.js'
import * as listings from '../../src/infrastructure/repositories/listings.js'
import * as reservations from '../../src/infrastructure/repositories/reservations.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import * as guests from '../../src/infrastructure/repositories/guests.js'

/**
 * Installs a fresh in-memory database around each test. Service tests run
 * against real SQL rather than mocked repositories, so schema constraints and
 * query predicates are exercised alongside the business rules.
 */
export function useTestDb(): void {
  beforeEach(() => {
    useDatabase(openDatabase(':memory:'))
  })

  afterEach(() => {
    closeDb()
  })
}

export const LISTING: Listing = {
  id: 'apt1',
  name: 'Beach House',
  address: '1 Ocean Ave',
  floor: 1,
  door: 'A',
  nightlyRate: 100,
  minNights: 2,
  maxAdults: 4,
  rooms: 2,
  bathrooms: 1,
  isActive: true,
}

export const GUEST: Guest = {
  id: 'cli1',
  name: 'Alice',
}

export const CHANNEL: Channel = {
  id: 'ch1',
  name: 'Direct',
  commissionRate: 0,
  isActive: true,
}

export function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'b1',
    listingId: 'apt1',
    guestId: 'cli1',
    channelId: 'ch1',
    checkIn: '2025-06-01',
    checkOut: '2025-06-05',
    adultCount: 1,
    childrenCount: 0,
    status: 'Confirmed',
    totalAmountDue: 400,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/** Seeds the one listing, guest and channel that reservations reference. */
export function seedBase(): void {
  listings.insert(LISTING)
  guests.insert(GUEST)
  channels.insert(CHANNEL)
}

export function seedReservation(overrides: Partial<Reservation> = {}): Reservation {
  const b = reservation(overrides)
  reservations.insert(b)
  return b
}
