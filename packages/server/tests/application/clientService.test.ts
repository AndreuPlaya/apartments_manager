import { beforeEach, describe, expect, it } from 'vitest'
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../../src/application/clientService.js'
import * as clients from '../../src/infrastructure/repositories/clients.js'
import { seedBase, seedBooking, useTestDb } from '../helpers/testDb.js'

useTestDb()

beforeEach(() => {
  seedBase()
  clients.update({
    id: 'cli1',
    name: 'Alice',
    identityDocument: 'A12345',
    email: 'alice@example.com',
  })
})

describe('listClients', () => {
  it('returns the stored clients', () => {
    expect(listClients()).toEqual([
      { id: 'cli1', name: 'Alice', identityDocument: 'A12345', email: 'alice@example.com' },
    ])
  })
})

describe('createClient', () => {
  it('creates a client with no optional fields', () => {
    const result = createClient({ name: 'Bob' })

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Bob')
    expect(clients.findById(result.id)).toEqual(result)
  })

  it('round-trips every optional field', () => {
    const result = createClient({
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

    expect(clients.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError for duplicate identityDocument (case-insensitive)', () => {
    expect(() => createClient({ name: 'Bob', identityDocument: 'a12345' })).toThrow('already exists')
    expect(listClients()).toHaveLength(1)
  })

  it('throws ConflictError for duplicate email (case-insensitive)', () => {
    expect(() => createClient({ name: 'Bob', email: 'ALICE@example.com' })).toThrow('already exists')
  })

  it('stores a blank document or email as absent, not as an empty string', () => {
    const result = createClient({ name: 'Bob', identityDocument: '', email: '   ' })

    expect(result.identityDocument).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(clients.findById(result.id)).toEqual(result)
  })

  it('allows many clients with blank documents and emails', () => {
    // The create form submits empty strings for untouched fields; these must not
    // collide with each other on the unique indexes.
    createClient({ name: 'Bob', identityDocument: '', email: '' })
    createClient({ name: 'Carol', identityDocument: '', email: '' })
    createClient({ name: 'Dave', identityDocument: '', email: '' })

    expect(listClients()).toHaveLength(4)
  })

  it('allows several clients without document or email', () => {
    createClient({ name: 'Bob' })
    createClient({ name: 'Carol' })

    expect(listClients()).toHaveLength(3)
  })
})

describe('updateClient', () => {
  it('updates a client successfully', () => {
    const result = updateClient('cli1', { name: 'Alicia' })

    expect(result.name).toBe('Alicia')
    expect(clients.findById('cli1')!.name).toBe('Alicia')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateClient('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when identityDocument conflicts with another client', () => {
    createClient({ name: 'Bob', identityDocument: 'B99999' })

    expect(() => updateClient('cli1', { identityDocument: 'b99999' })).toThrow('already exists')
    expect(clients.findById('cli1')!.identityDocument).toBe('A12345')
  })

  it('throws ConflictError when email conflicts with another client', () => {
    createClient({ name: 'Bob', email: 'bob@example.com' })

    expect(() => updateClient('cli1', { email: 'BOB@example.com' })).toThrow('already exists')
  })

  it('clears the document when updated to a blank value', () => {
    const result = updateClient('cli1', { identityDocument: '', email: '' })

    expect(result.identityDocument).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(clients.findById('cli1')!.identityDocument).toBeUndefined()
  })

  it('allows updating identityDocument to own value', () => {
    expect(updateClient('cli1', { identityDocument: 'A12345' }).identityDocument).toBe('A12345')
  })
})

describe('deleteClient', () => {
  it('deletes a client with no bookings', () => {
    deleteClient('cli1')

    expect(listClients()).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteClient('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the client has existing bookings', () => {
    seedBooking()

    expect(() => deleteClient('cli1')).toThrow('existing bookings')
    expect(listClients()).toHaveLength(1)
  })
})
