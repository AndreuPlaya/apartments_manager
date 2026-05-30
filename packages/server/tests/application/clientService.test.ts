import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Booking, Client } from '../../src/domain/models.js'

vi.mock('../../src/infrastructure/data.js')
import {
  loadBookings,
  loadClients,
  saveClients,
} from '../../src/infrastructure/data.js'

import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../../src/application/clientService.js'

const client: Client = {
  id: 'cli1',
  name: 'Alice',
  identityDocument: 'A12345',
  email: 'alice@example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadClients).mockReturnValue([client])
  vi.mocked(loadBookings).mockReturnValue([])
  vi.mocked(saveClients).mockImplementation(() => undefined)
})

describe('listClients', () => {
  it('returns what loadClients returns', () => {
    expect(listClients()).toEqual([client])
  })
})

describe('createClient', () => {
  it('creates a client with no optional fields', () => {
    vi.mocked(loadClients).mockReturnValue([])
    const result = createClient({ name: 'Bob' })
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Bob')
    expect(saveClients).toHaveBeenCalledOnce()
  })

  it('throws ConflictError for duplicate identityDocument (case-insensitive)', () => {
    expect(() => createClient({ name: 'Bob', identityDocument: 'a12345' })).toThrow('already exists')
  })

  it('throws ConflictError for duplicate email (case-insensitive)', () => {
    expect(() => createClient({ name: 'Bob', email: 'ALICE@example.com' })).toThrow('already exists')
  })
})

describe('updateClient', () => {
  it('updates a client successfully', () => {
    const result = updateClient('cli1', { name: 'Alicia' })
    expect(result.name).toBe('Alicia')
    expect(saveClients).toHaveBeenCalledOnce()
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateClient('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when identityDocument conflicts with another client', () => {
    vi.mocked(loadClients).mockReturnValue([
      client,
      { id: 'cli2', name: 'Bob', identityDocument: 'B99999' },
    ])
    expect(() => updateClient('cli1', { identityDocument: 'b99999' })).toThrow('already exists')
  })

  it('throws ConflictError when email conflicts with another client', () => {
    vi.mocked(loadClients).mockReturnValue([
      client,
      { id: 'cli2', name: 'Bob', email: 'bob@example.com' },
    ])
    expect(() => updateClient('cli1', { email: 'BOB@example.com' })).toThrow('already exists')
  })

  it('allows updating identityDocument to own value', () => {
    const result = updateClient('cli1', { identityDocument: 'A12345' })
    expect(result.identityDocument).toBe('A12345')
  })
})

describe('deleteClient', () => {
  it('deletes a client with no bookings', () => {
    deleteClient('cli1')
    expect(saveClients).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteClient('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the client has existing bookings', () => {
    const booking: Booking = {
      id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
      fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
      status: 'Active', totalAmountDue: 0, createdAt: '',
    }
    vi.mocked(loadBookings).mockReturnValue([booking])
    expect(() => deleteClient('cli1')).toThrow('existing bookings')
  })
})
