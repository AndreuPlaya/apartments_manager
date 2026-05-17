import { randomUUID } from 'node:crypto'
import type { Channel, CreateChannelRequest, UpdateChannelRequest } from '../domain/models.js'
import { loadBookings, loadChannels, saveChannels } from '../infrastructure/data.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listChannels(): Channel[] {
  return loadChannels()
}

export function createChannel(req: CreateChannelRequest): Channel {
  const all = loadChannels()
  const nameLower = req.name.toLowerCase()
  if (all.some((c) => c.name.toLowerCase() === nameLower)) {
    throw new ConflictError(`Channel name '${req.name}' already exists`)
  }
  const channel: Channel = { id: randomUUID(), ...req }
  saveChannels([...all, channel])
  return channel
}

export function updateChannel(id: string, req: UpdateChannelRequest): Channel {
  const all = loadChannels()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new NotFoundError(`Channel '${id}' not found`)

  if (req.name !== undefined) {
    const nameLower = req.name.toLowerCase()
    if (all.some((c) => c.id !== id && c.name.toLowerCase() === nameLower)) {
      throw new ConflictError(`Channel name '${req.name}' already exists`)
    }
  }

  const updated: Channel = { ...all[idx]!, ...req }
  all[idx] = updated
  saveChannels(all)
  return updated
}

export function deleteChannel(id: string): void {
  const all = loadChannels()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new NotFoundError(`Channel '${id}' not found`)

  const bookings = loadBookings()
  if (bookings.some((b) => b.channelId === id)) {
    throw new ConflictError('Cannot delete channel with existing bookings')
  }

  saveChannels(all.filter((c) => c.id !== id))
}
