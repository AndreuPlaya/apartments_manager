import { beforeEach, describe, expect, it } from 'vitest'
import {
  createChannel,
  deleteChannel,
  listChannels,
  updateChannel,
} from '../../src/application/channelService.js'
import type { Channel } from '../../src/domain/models.js'
import * as channels from '../../src/infrastructure/repositories/channels.js'
import { seedBase, seedBooking, useTestDb } from '../helpers/testDb.js'

useTestDb()

const airbnb: Channel = { id: 'ch2', name: 'Airbnb', commissionRate: 0.12, isActive: true }

beforeEach(() => {
  seedBase()
  channels.insert(airbnb)
})

describe('listChannels', () => {
  it('returns the stored channels ordered by name', () => {
    expect(listChannels().map((c) => c.name)).toEqual(['Airbnb', 'Direct'])
  })
})

describe('createChannel', () => {
  it('creates a channel with a generated id and persists it', () => {
    const result = createChannel({ name: 'Vrbo', commissionRate: 0.08, isActive: true })

    expect(result.id).toBeDefined()
    expect(channels.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createChannel({ name: 'airbnb', commissionRate: 0, isActive: true })).toThrow(
      'already exists',
    )
    expect(listChannels()).toHaveLength(2)
  })
})

describe('updateChannel', () => {
  it('updates a channel successfully', () => {
    const result = updateChannel('ch2', { commissionRate: 0.15 })

    expect(result.commissionRate).toBe(0.15)
    expect(channels.findById('ch2')!.commissionRate).toBe(0.15)
  })

  it('persists isActive as a boolean', () => {
    expect(updateChannel('ch2', { isActive: false }).isActive).toBe(false)
    expect(channels.findById('ch2')!.isActive).toBe(false)
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateChannel('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    expect(() => updateChannel('ch2', { name: 'direct' })).toThrow('already exists')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    expect(updateChannel('ch2', { name: 'Airbnb' }).name).toBe('Airbnb')
  })
})

describe('deleteChannel', () => {
  it('deletes a channel with no bookings', () => {
    deleteChannel('ch2')

    expect(listChannels().map((c) => c.id)).toEqual(['ch1'])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteChannel('ghost')).toThrow('not found')
  })

  it('throws ConflictError when the channel has existing bookings', () => {
    seedBooking()

    expect(() => deleteChannel('ch1')).toThrow('existing bookings')
    expect(listChannels()).toHaveLength(2)
  })
})
