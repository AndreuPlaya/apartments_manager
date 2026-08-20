import { beforeEach, describe, expect, it } from 'vitest'
import {
  createBooking,
  deleteBooking,
  listBookings,
  patchBookingFields,
  updateBooking,
} from '../../src/application/bookingService.js'
import type { CreateBookingRequest } from '../../src/domain/models.js'
import * as apartments from '../../src/infrastructure/repositories/apartments.js'
import * as bookings from '../../src/infrastructure/repositories/bookings.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import { APARTMENT, CHANNEL, seedBase, seedBooking, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
})

const validReq: CreateBookingRequest = {
  apartmentId: 'apt1',
  clientId: 'cli1',
  channelId: 'ch1',
  fromDate: '2025-06-01',
  toDate: '2025-06-05',
  adultCount: 2,
  childrenCount: 0,
  status: 'Active',
  totalAmountDue: 400,
}

describe('listBookings', () => {
  it('returns every booking when no filter is given', () => {
    const b = seedBooking()

    expect(listBookings({})).toEqual([b])
  })

  it('filters by apartment', () => {
    apartments.insert({ ...APARTMENT, id: 'apt2', name: 'Villa' })
    seedBooking()
    const other = seedBooking({ id: 'b2', apartmentId: 'apt2' })

    expect(listBookings({ apartmentId: 'apt2' })).toEqual([other])
  })

  it('filters by an open-ended window', () => {
    seedBooking({ id: 'b1', fromDate: '2025-06-01', toDate: '2025-06-05' })
    seedBooking({ id: 'b2', fromDate: '2025-08-01', toDate: '2025-08-05' })

    expect(listBookings({ from: '2025-07-01' }).map((b) => b.id)).toEqual(['b2'])
    expect(listBookings({ to: '2025-07-01' }).map((b) => b.id)).toEqual(['b1'])
  })

  it('filters by a closed window, excluding the checkout day', () => {
    seedBooking({ id: 'b1', fromDate: '2025-06-01', toDate: '2025-06-05' })

    expect(listBookings({ from: '2025-06-05', to: '2025-06-10' })).toEqual([])
    expect(listBookings({ from: '2025-06-04', to: '2025-06-10' })).toHaveLength(1)
  })
})

describe('createBooking', () => {
  it('creates a valid booking with generated id and createdAt', () => {
    const result = createBooking(validReq)

    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.fromDate).toBe('2025-06-01')
    expect(result.toDate).toBe('2025-06-05')
    expect(bookings.findById(result.id)).toEqual(result)
  })

  it('round-trips optional fields', () => {
    const result = createBooking({
      ...validReq,
      cribRequested: true,
      comment: 'late arrival',
      paidDate: '2025-05-20',
    })

    expect(bookings.findById(result.id)).toEqual(result)
  })

  it('strips time component from dates', () => {
    const result = createBooking({
      ...validReq,
      fromDate: '2025-06-01T12:00:00Z',
      toDate: '2025-06-05T12:00:00Z',
    })

    expect(result.fromDate).toBe('2025-06-01')
    expect(result.toDate).toBe('2025-06-05')
  })

  it('throws ValidationError when toDate <= fromDate', () => {
    expect(() => createBooking({ ...validReq, toDate: '2025-06-01' })).toThrow(
      'toDate must be after fromDate',
    )
  })

  it('throws ValidationError when minNights not met (1 night, min 2)', () => {
    expect(() => createBooking({ ...validReq, toDate: '2025-06-02' })).toThrow('Minimum 2 night')
  })

  it('throws ValidationError for non-existent apartment', () => {
    expect(() => createBooking({ ...validReq, apartmentId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for unavailable apartment', () => {
    apartments.update({ ...APARTMENT, isAvailable: false })

    expect(() => createBooking(validReq)).toThrow('not available')
  })

  it('throws ValidationError for non-existent client', () => {
    expect(() => createBooking({ ...validReq, clientId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for non-existent channel', () => {
    expect(() => createBooking({ ...validReq, channelId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for inactive channel', () => {
    channels.update({ ...CHANNEL, isActive: false })

    expect(() => createBooking(validReq)).toThrow('not active')
  })

  it('throws ConflictError when dates overlap an existing booking', () => {
    seedBooking({ id: 'b-existing', fromDate: '2025-06-03', toDate: '2025-06-08' })

    expect(() => createBooking(validReq)).toThrow('overlap')
    expect(listBookings({})).toHaveLength(1)
  })

  it('does NOT throw when new checkin equals existing checkout (adjacent)', () => {
    seedBooking({ id: 'b-existing', fromDate: '2025-05-28', toDate: '2025-06-01' })

    expect(() => createBooking(validReq)).not.toThrow()
  })

  it('rolls back the insert when a later rule rejects the booking', () => {
    expect(() => createBooking({ ...validReq, channelId: 'no-such' })).toThrow()
    expect(listBookings({})).toEqual([])
  })
})

describe('updateBooking', () => {
  beforeEach(() => {
    seedBooking({ adultCount: 2 })
  })

  it('updates non-date fields without re-validating dates', () => {
    const result = updateBooking('b1', { totalAmountDue: 500 })

    expect(result.totalAmountDue).toBe(500)
    expect(result.fromDate).toBe('2025-06-01')
    expect(bookings.findById('b1')!.totalAmountDue).toBe(500)
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateBooking('does-not-exist', {})).toThrow('not found')
  })

  it('excludes self when checking overlap during date update', () => {
    expect(updateBooking('b1', { fromDate: '2025-06-02' }).fromDate).toBe('2025-06-02')
  })

  it('throws ConflictError when updated dates overlap another booking', () => {
    seedBooking({ id: 'b2', fromDate: '2025-06-08', toDate: '2025-06-12' })

    expect(() => updateBooking('b1', { toDate: '2025-06-10' })).toThrow('overlap')
    expect(bookings.findById('b1')!.toDate).toBe('2025-06-05')
  })

  it('throws ValidationError when updated dates are invalid (toDate <= fromDate)', () => {
    expect(() => updateBooking('b1', { toDate: '2025-05-31' })).toThrow(
      'toDate must be after fromDate',
    )
  })

  it('throws ValidationError when updated apartment not found', () => {
    expect(() => updateBooking('b1', { apartmentId: 'no-such-apt' })).toThrow('not found')
  })

  it('throws ValidationError when updated apartment is unavailable', () => {
    apartments.update({ ...APARTMENT, isAvailable: false })

    expect(() => updateBooking('b1', { apartmentId: 'apt1' })).toThrow('not available')
  })

  it('throws ValidationError when minNights not met after date change', () => {
    expect(() => updateBooking('b1', { toDate: '2025-06-02' })).toThrow('Minimum')
  })

  it('validates channelId when updating channel', () => {
    expect(() => updateBooking('b1', { channelId: 'no-such-ch' })).toThrow('not found')
  })

  it('throws ValidationError when updated channel is inactive', () => {
    channels.update({ ...CHANNEL, isActive: false })

    expect(() => updateBooking('b1', { channelId: 'ch1' })).toThrow('not active')
  })

  it('validates clientId when updating client', () => {
    expect(() => updateBooking('b1', { clientId: 'no-such-cli' })).toThrow('not found')
  })
})

describe('deleteBooking', () => {
  it('removes an existing booking', () => {
    seedBooking()

    deleteBooking('b1')

    expect(listBookings({})).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteBooking('ghost')).toThrow('not found')
  })
})

describe('patchBookingFields', () => {
  beforeEach(() => {
    seedBooking()
  })

  it('patches comment only', () => {
    const result = patchBookingFields('b1', { comment: 'hello' })

    expect(result.comment).toBe('hello')
    expect(result.status).toBe('Active')
    expect(bookings.findById('b1')!.comment).toBe('hello')
  })

  it('patches status only', () => {
    const result = patchBookingFields('b1', { status: 'Cancelled' })

    expect(result.status).toBe('Cancelled')
    expect(result.comment).toBeUndefined()
  })

  it('patches paidDate only', () => {
    expect(patchBookingFields('b1', { paidDate: '2025-06-02' }).paidDate).toBe('2025-06-02')
  })

  it('patches multiple fields at once', () => {
    const result = patchBookingFields('b1', {
      comment: 'hi',
      paidDate: '2025-06-03',
      status: 'Cancelled',
    })

    expect(result.comment).toBe('hi')
    expect(result.paidDate).toBe('2025-06-03')
    expect(result.status).toBe('Cancelled')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => patchBookingFields('ghost', { comment: 'x' })).toThrow('not found')
  })
})
