import { beforeEach, describe, expect, it } from 'vitest'
import {
  createReservation,
  deleteReservation,
  listReservations,
  patchReservationFields,
  updateReservation,
} from '../../src/application/reservationService.js'
import type { CreateReservationRequest } from '../../src/domain/models.js'
import * as listings from '../../src/infrastructure/repositories/listings.js'
import * as reservations from '../../src/infrastructure/repositories/reservations.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import { LISTING, CHANNEL, seedBase, seedReservation, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
})

const validReq: CreateReservationRequest = {
  listingId: 'apt1',
  guestId: 'cli1',
  channelId: 'ch1',
  checkIn: '2025-06-01',
  checkOut: '2025-06-05',
  adultCount: 2,
  childrenCount: 0,
  totalAmountDue: 400,
}

describe('listReservations', () => {
  it('returns every reservation when no filter is given', () => {
    const b = seedReservation()

    expect(listReservations({})).toEqual([b])
  })

  it('filters by listing', () => {
    listings.insert({ ...LISTING, id: 'apt2', name: 'Villa' })
    seedReservation()
    const other = seedReservation({ id: 'b2', listingId: 'apt2' })

    expect(listReservations({ listingId: 'apt2' })).toEqual([other])
  })

  it('filters by an open-ended window', () => {
    seedReservation({ id: 'b1', checkIn: '2025-06-01', checkOut: '2025-06-05' })
    seedReservation({ id: 'b2', checkIn: '2025-08-01', checkOut: '2025-08-05' })

    expect(listReservations({ from: '2025-07-01' }).map((b) => b.id)).toEqual(['b2'])
    expect(listReservations({ to: '2025-07-01' }).map((b) => b.id)).toEqual(['b1'])
  })

  it('filters by a closed window, excluding the checkout day', () => {
    seedReservation({ id: 'b1', checkIn: '2025-06-01', checkOut: '2025-06-05' })

    expect(listReservations({ from: '2025-06-05', to: '2025-06-10' })).toEqual([])
    expect(listReservations({ from: '2025-06-04', to: '2025-06-10' })).toHaveLength(1)
  })
})

describe('createReservation', () => {
  it('creates a valid reservation with generated id and createdAt', () => {
    const result = createReservation(validReq)

    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.checkIn).toBe('2025-06-01')
    expect(result.checkOut).toBe('2025-06-05')
    expect(reservations.findById(result.id)).toEqual(result)
  })

  it('round-trips optional fields', () => {
    const result = createReservation({
      ...validReq,
      cribRequested: true,
      comment: 'late arrival',
      paidDate: '2025-05-20',
    })

    expect(reservations.findById(result.id)).toEqual(result)
  })

  it('strips time component from dates', () => {
    const result = createReservation({
      ...validReq,
      checkIn: '2025-06-01T12:00:00Z',
      checkOut: '2025-06-05T12:00:00Z',
    })

    expect(result.checkIn).toBe('2025-06-01')
    expect(result.checkOut).toBe('2025-06-05')
  })

  it('throws ValidationError when checkOut <= checkIn', () => {
    expect(() => createReservation({ ...validReq, checkOut: '2025-06-01' })).toThrow(
      'checkOut must be after checkIn',
    )
  })

  it('throws ValidationError when minNights not met (1 night, min 2)', () => {
    expect(() => createReservation({ ...validReq, checkOut: '2025-06-02' })).toThrow('Minimum 2 night')
  })

  it('throws ValidationError for non-existent listing', () => {
    expect(() => createReservation({ ...validReq, listingId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for an inactive listing', () => {
    listings.update({ ...LISTING, isActive: false })

    expect(() => createReservation(validReq)).toThrow('is not active')
  })

  it('throws ValidationError for non-existent guest', () => {
    expect(() => createReservation({ ...validReq, guestId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for non-existent channel', () => {
    expect(() => createReservation({ ...validReq, channelId: 'no-such' })).toThrow('not found')
  })

  it('throws ValidationError for inactive channel', () => {
    channels.update({ ...CHANNEL, isActive: false })

    expect(() => createReservation(validReq)).toThrow('not active')
  })

  it('throws ConflictError when dates overlap an existing reservation', () => {
    seedReservation({ id: 'b-existing', checkIn: '2025-06-03', checkOut: '2025-06-08' })

    expect(() => createReservation(validReq)).toThrow('overlap')
    expect(listReservations({})).toHaveLength(1)
  })

  it('does NOT throw when new checkin equals existing checkout (adjacent)', () => {
    seedReservation({ id: 'b-existing', checkIn: '2025-05-28', checkOut: '2025-06-01' })

    expect(() => createReservation(validReq)).not.toThrow()
  })

  it('rolls back the insert when a later rule rejects the reservation', () => {
    expect(() => createReservation({ ...validReq, channelId: 'no-such' })).toThrow()
    expect(listReservations({})).toEqual([])
  })
})

describe('updateReservation', () => {
  beforeEach(() => {
    seedReservation({ adultCount: 2 })
  })

  it('updates non-date fields without re-validating dates', () => {
    const result = updateReservation('b1', { totalAmountDue: 500 })

    expect(result.totalAmountDue).toBe(500)
    expect(result.checkIn).toBe('2025-06-01')
    expect(reservations.findById('b1')!.totalAmountDue).toBe(500)
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateReservation('does-not-exist', {})).toThrow('not found')
  })

  it('excludes self when checking overlap during date update', () => {
    expect(updateReservation('b1', { checkIn: '2025-06-02' }).checkIn).toBe('2025-06-02')
  })

  it('throws ConflictError when updated dates overlap another reservation', () => {
    seedReservation({ id: 'b2', checkIn: '2025-06-08', checkOut: '2025-06-12' })

    expect(() => updateReservation('b1', { checkOut: '2025-06-10' })).toThrow('overlap')
    expect(reservations.findById('b1')!.checkOut).toBe('2025-06-05')
  })

  it('throws ValidationError when updated dates are invalid (checkOut <= checkIn)', () => {
    expect(() => updateReservation('b1', { checkOut: '2025-05-31' })).toThrow(
      'checkOut must be after checkIn',
    )
  })

  it('throws ValidationError when updated listing not found', () => {
    expect(() => updateReservation('b1', { listingId: 'no-such-apt' })).toThrow('not found')
  })

  it('throws ValidationError when the updated listing is inactive', () => {
    listings.update({ ...LISTING, isActive: false })

    expect(() => updateReservation('b1', { listingId: 'apt1' })).toThrow('is not active')
  })

  it('throws ValidationError when minNights not met after date change', () => {
    expect(() => updateReservation('b1', { checkOut: '2025-06-02' })).toThrow('Minimum')
  })

  it('validates channelId when updating channel', () => {
    expect(() => updateReservation('b1', { channelId: 'no-such-ch' })).toThrow('not found')
  })

  it('throws ValidationError when updated channel is inactive', () => {
    channels.update({ ...CHANNEL, isActive: false })

    expect(() => updateReservation('b1', { channelId: 'ch1' })).toThrow('not active')
  })

  it('validates guestId when updating guest', () => {
    expect(() => updateReservation('b1', { guestId: 'no-such-cli' })).toThrow('not found')
  })
})

describe('deleteReservation', () => {
  it('removes an existing reservation', () => {
    seedReservation()

    deleteReservation('b1')

    expect(listReservations({})).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteReservation('ghost')).toThrow('not found')
  })
})

describe('patchReservationFields', () => {
  beforeEach(() => {
    seedReservation()
  })

  it('patches comment only', () => {
    const result = patchReservationFields('b1', { comment: 'hello' })

    expect(result.comment).toBe('hello')
    expect(result.status).toBe('Confirmed')
    expect(reservations.findById('b1')!.comment).toBe('hello')
  })

  it('patches status only', () => {
    const result = patchReservationFields('b1', { status: 'Cancelled' })

    expect(result.status).toBe('Cancelled')
    expect(result.comment).toBeUndefined()
  })

  it('patches paidDate only', () => {
    expect(patchReservationFields('b1', { paidDate: '2025-06-02' }).paidDate).toBe('2025-06-02')
  })

  it('patches multiple fields at once', () => {
    const result = patchReservationFields('b1', {
      comment: 'hi',
      paidDate: '2025-06-03',
      status: 'Cancelled',
    })

    expect(result.comment).toBe('hi')
    expect(result.paidDate).toBe('2025-06-03')
    expect(result.status).toBe('Cancelled')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => patchReservationFields('ghost', { comment: 'x' })).toThrow('not found')
  })
})

describe('maxGuests', () => {
  it('rejects a guest count over the listing capacity', () => {
    expect(() => createReservation({ ...validReq, adultCount: 5, childrenCount: 0 })).toThrow(
      'Maximum 4 guest(s)',
    )
  })

  it('counts children towards the capacity', () => {
    expect(() => createReservation({ ...validReq, adultCount: 3, childrenCount: 2 })).toThrow(
      'Maximum 4 guest(s)',
    )
  })

  it('accepts a guest count exactly at the capacity', () => {
    expect(createReservation({ ...validReq, adultCount: 2, childrenCount: 2 }).adultCount).toBe(2)
  })

  it('revalidates the capacity when only the guest count changes', () => {
    seedReservation()

    expect(() => updateReservation('b1', { adultCount: 9 })).toThrow('Maximum 4 guest(s)')
  })
})

describe('initial status', () => {
  it('creates every reservation Confirmed, whatever the caller sends', () => {
    const result = createReservation({ ...validReq, status: 'CheckedOut' } as never)

    expect(result.status).toBe('Confirmed')
  })
})

describe('released dates', () => {
  it('lets a cancelled stay be rebooked on the same dates', () => {
    seedReservation({ status: 'Cancelled' })

    expect(createReservation(validReq).status).toBe('Confirmed')
  })

  it('lets a no-show stay be rebooked on the same dates', () => {
    seedReservation({ status: 'NoShow' })

    expect(createReservation(validReq).status).toBe('Confirmed')
  })

  it('still blocks a checked-out stay — a past stay is history, not free space', () => {
    seedReservation({ status: 'CheckedOut' })

    expect(() => createReservation(validReq)).toThrow('overlap')
  })

  it('still blocks a checked-in stay', () => {
    seedReservation({ status: 'CheckedIn' })

    expect(() => createReservation(validReq)).toThrow('overlap')
  })
})

describe('lifecycle transitions', () => {
  it('allows Confirmed to CheckedIn', () => {
    seedReservation()

    expect(patchReservationFields('b1', { status: 'CheckedIn' }).status).toBe('CheckedIn')
  })

  it('allows CheckedIn to CheckedOut', () => {
    seedReservation({ status: 'CheckedIn' })

    expect(patchReservationFields('b1', { status: 'CheckedOut' }).status).toBe('CheckedOut')
  })

  it('refuses Confirmed to CheckedOut, skipping the arrival', () => {
    seedReservation()

    expect(() => patchReservationFields('b1', { status: 'CheckedOut' })).toThrow(
      'Cannot go from Confirmed to CheckedOut',
    )
  })

  it('refuses to un-arrive a checked-in guest', () => {
    seedReservation({ status: 'CheckedIn' })

    expect(() => patchReservationFields('b1', { status: 'Confirmed' })).toThrow(
      'Cannot go from CheckedIn to Confirmed',
    )
  })

  it('refuses to reactivate a cancelled stay', () => {
    seedReservation({ status: 'Cancelled' })

    expect(() => patchReservationFields('b1', { status: 'Confirmed' })).toThrow(
      'A Cancelled reservation is final',
    )
  })

  it('refuses to reactivate a no-show', () => {
    seedReservation({ status: 'NoShow' })

    expect(() => patchReservationFields('b1', { status: 'Confirmed' })).toThrow(
      'A NoShow reservation is final',
    )
  })

  it('treats resending the current status as a no-op, not a transition', () => {
    seedReservation({ status: 'CheckedOut' })

    expect(patchReservationFields('b1', { status: 'CheckedOut', comment: 'x' }).comment).toBe('x')
  })

  it('enforces the graph on the full-edit path too', () => {
    seedReservation({ status: 'Cancelled' })

    expect(() => updateReservation('b1', { status: 'CheckedIn' })).toThrow('is final')
  })

  it('lets an override leave a terminal state', () => {
    seedReservation({ status: 'Cancelled' })

    expect(
      patchReservationFields('b1', { status: 'Confirmed' }, { override: true }).status,
    ).toBe('Confirmed')
  })

  it('lets an override skip a step', () => {
    seedReservation()

    expect(updateReservation('b1', { status: 'CheckedOut' }, { override: true }).status).toBe(
      'CheckedOut',
    )
  })

  it('does not let an override double-book — it lifts the graph, not the stay rules', () => {
    seedReservation({ status: 'Cancelled' })
    seedReservation({ id: 'b2', checkIn: '2025-06-01', checkOut: '2025-06-05' })

    expect(() =>
      updateReservation('b1', { status: 'Confirmed', checkIn: '2025-06-02' }, { override: true }),
    ).toThrow('overlap')
  })

  it('allows payment to be recorded in a terminal state', () => {
    seedReservation({ status: 'NoShow' })

    expect(patchReservationFields('b1', { paidDate: '2025-06-10' }).paidDate).toBe('2025-06-10')
  })
})
