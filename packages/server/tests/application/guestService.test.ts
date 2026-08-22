import { beforeEach, describe, expect, it } from 'vitest'
import {
  createGuest,
  deleteGuest,
  listGuests,
  updateGuest,
} from '../../src/application/guestService.js'
import * as guests from '../../src/infrastructure/repositories/guests.js'
import { seedBase, seedReservation, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
  guests.update({
    id: 'cli1',
    name: 'Alice',
    identityDocument: 'A12345',
    email: 'alice@example.com',
  })
})

describe('listGuests', () => {
  it('returns the stored guests', () => {
    expect(listGuests()).toEqual([
      { id: 'cli1', name: 'Alice', identityDocument: 'A12345', email: 'alice@example.com' },
    ])
  })
})

describe('createGuest', () => {
  it('creates a guest with no optional fields', () => {
    const result = createGuest({ name: 'Bob' })

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Bob')
    expect(guests.findById(result.id)).toEqual(result)
  })

  it('round-trips every optional field', () => {
    const result = createGuest({
      name: 'Bob',
      identityDocument: 'B99999',
      email: 'bob@example.com',
      phoneNumber: '+34600000000',
      street: '3 Elm St',
      city: 'Valencia',
      country: 'ES',
      zipCode: '46001',
      comment: 'VIP',
    })

    expect(guests.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError for duplicate identityDocument (case-insensitive)', () => {
    expect(() => createGuest({ name: 'Bob', identityDocument: 'a12345' })).toThrow('already exists')
    expect(listGuests()).toHaveLength(1)
  })

  it('throws ConflictError for duplicate email (case-insensitive)', () => {
    expect(() => createGuest({ name: 'Bob', email: 'ALICE@example.com' })).toThrow('already exists')
  })

  it('stores a blank document or email as absent, not as an empty string', () => {
    const result = createGuest({ name: 'Bob', identityDocument: '', email: '   ' })

    expect(result.identityDocument).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(guests.findById(result.id)).toEqual(result)
  })

  it('allows many guests with blank documents and emails', () => {
    // The create form submits empty strings for untouched fields; these must not
    // collide with each other on the unique indexes.
    createGuest({ name: 'Bob', identityDocument: '', email: '' })
    createGuest({ name: 'Carol', identityDocument: '', email: '' })
    createGuest({ name: 'Dave', identityDocument: '', email: '' })

    expect(listGuests()).toHaveLength(4)
  })

  it('allows several guests without document or email', () => {
    createGuest({ name: 'Bob' })
    createGuest({ name: 'Carol' })

    expect(listGuests()).toHaveLength(3)
  })
})

describe('updateGuest', () => {
  it('updates a guest successfully', () => {
    const result = updateGuest('cli1', { name: 'Alicia' })

    expect(result.name).toBe('Alicia')
    expect(guests.findById('cli1')!.name).toBe('Alicia')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateGuest('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when identityDocument conflicts with another guest', () => {
    createGuest({ name: 'Bob', identityDocument: 'B99999' })

    expect(() => updateGuest('cli1', { identityDocument: 'b99999' })).toThrow('already exists')
    expect(guests.findById('cli1')!.identityDocument).toBe('A12345')
  })

  it('throws ConflictError when email conflicts with another guest', () => {
    createGuest({ name: 'Bob', email: 'bob@example.com' })

    expect(() => updateGuest('cli1', { email: 'BOB@example.com' })).toThrow('already exists')
  })

  it('clears the document when updated to a blank value', () => {
    const result = updateGuest('cli1', { identityDocument: '', email: '' })

    expect(result.identityDocument).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(guests.findById('cli1')!.identityDocument).toBeUndefined()
  })

  it('allows updating identityDocument to own value', () => {
    expect(updateGuest('cli1', { identityDocument: 'A12345' }).identityDocument).toBe('A12345')
  })
})

describe('deleteGuest', () => {
  it('deletes a guest with no reservations', () => {
    deleteGuest('cli1')

    expect(listGuests()).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteGuest('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the guest has existing reservations', () => {
    seedReservation()

    expect(() => deleteGuest('cli1')).toThrow('existing reservations')
    expect(listGuests()).toHaveLength(1)
  })
})
