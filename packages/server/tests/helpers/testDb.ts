import { afterEach, beforeEach } from 'vitest'
import type { Apartment, Booking, Channel, Client } from '../../src/domain/models.js'
import { closeDb, openDatabase, useDatabase } from '../../src/infrastructure/db.js'
import * as apartments from '../../src/infrastructure/repositories/apartments.js'
import * as bookings from '../../src/infrastructure/repositories/bookings.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import * as clients from '../../src/infrastructure/repositories/clients.js'

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

export const APARTMENT: Apartment = {
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

export const CLIENT: Client = {
  id: 'cli1',
  name: 'Alice',
}

export const CHANNEL: Channel = {
  id: 'ch1',
  name: 'Direct',
  commissionRate: 0,
  isActive: true,
}

export function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    apartmentId: 'apt1',
    clientId: 'cli1',
    channelId: 'ch1',
    fromDate: '2025-06-01',
    toDate: '2025-06-05',
    adultCount: 1,
    childrenCount: 0,
    status: 'Active',
    totalAmountDue: 400,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/** Seeds the one apartment, client and channel that bookings reference. */
export function seedBase(): void {
  apartments.insert(APARTMENT)
  clients.insert(CLIENT)
  channels.insert(CHANNEL)
}

export function seedBooking(overrides: Partial<Booking> = {}): Booking {
  const b = booking(overrides)
  bookings.insert(b)
  return b
}
