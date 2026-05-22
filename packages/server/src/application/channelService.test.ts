import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Booking, Channel } from '../domain/models.js'

vi.mock('../infrastructure/data.js')
import {
  loadBookings,
  loadChannels,
  saveChannels,
} from '../infrastructure/data.js'

import {
  createChannel,
  deleteChannel,
  listChannels,
  updateChannel,
} from './channelService.js'

const channel: Channel = {
  id: 'ch1',
  name: 'Airbnb',
  commissionRate: 0.12,
  isActive: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadChannels).mockReturnValue([channel])
  vi.mocked(loadBookings).mockReturnValue([])
  vi.mocked(saveChannels).mockImplementation(() => undefined)
})

describe('listChannels', () => {
  it('returns what loadChannels returns', () => {
    expect(listChannels()).toEqual([channel])
  })
})

describe('createChannel', () => {
  it('creates a channel with a generated id', () => {
    vi.mocked(loadChannels).mockReturnValue([])
    const result = createChannel({ name: 'Direct', commissionRate: 0, isActive: true })
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Direct')
    expect(saveChannels).toHaveBeenCalledOnce()
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createChannel({ name: 'airbnb', commissionRate: 0, isActive: true })).toThrow('already exists')
  })
})

describe('updateChannel', () => {
  it('updates a channel successfully', () => {
    const result = updateChannel('ch1', { commissionRate: 0.15 })
    expect(result.commissionRate).toBe(0.15)
    expect(saveChannels).toHaveBeenCalledOnce()
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateChannel('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    vi.mocked(loadChannels).mockReturnValue([
      channel,
      { id: 'ch2', name: 'Booking.com', commissionRate: 0.1, isActive: true },
    ])
    expect(() => updateChannel('ch1', { name: 'booking.com' })).toThrow('already exists')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    const result = updateChannel('ch1', { name: 'Airbnb' })
    expect(result.name).toBe('Airbnb')
  })
})

describe('deleteChannel', () => {
  it('deletes a channel with no bookings', () => {
    deleteChannel('ch1')
    expect(saveChannels).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteChannel('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the channel has existing bookings', () => {
    const booking: Booking = {
      id: 'b1', apartmentId: 'apt1', clientId: 'cli1', channelId: 'ch1',
      fromDate: '2025-06-01', toDate: '2025-06-05', adultCount: 1, childrenCount: 0,
      status: 'Active', totalAmountDue: 0, createdAt: '',
    }
    vi.mocked(loadBookings).mockReturnValue([booking])
    expect(() => deleteChannel('ch1')).toThrow('existing bookings')
  })
})
