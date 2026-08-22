import { randomUUID } from 'node:crypto'
import type { Channel, CreateChannelRequest, UpdateChannelRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as reservations from '../infrastructure/repositories/reservations.js'
import * as channels from '../infrastructure/repositories/channels.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listChannels(): Channel[] {
  return channels.list()
}

export function createChannel(req: CreateChannelRequest): Channel {
  return transaction(() => {
    if (channels.findByName(req.name) !== null) {
      throw new ConflictError(`Channel name '${req.name}' already exists`)
    }
    const channel: Channel = { id: randomUUID(), ...req }
    channels.insert(channel)
    return channel
  })
}

export function updateChannel(id: string, req: UpdateChannelRequest): Channel {
  return transaction(() => {
    const existing = channels.findById(id)
    if (existing === null) throw new NotFoundError(`Channel '${id}' not found`)

    if (req.name !== undefined && channels.findByName(req.name, id) !== null) {
      throw new ConflictError(`Channel name '${req.name}' already exists`)
    }

    const updated: Channel = { ...existing, ...req }
    channels.update(updated)
    return updated
  })
}

export function deleteChannel(id: string): void {
  transaction(() => {
    if (channels.findById(id) === null) throw new NotFoundError(`Channel '${id}' not found`)
    if (reservations.existsForChannel(id)) {
      throw new ConflictError('Cannot delete channel with existing reservations')
    }
    channels.deleteById(id)
  })
}
