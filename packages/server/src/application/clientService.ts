import { randomUUID } from 'node:crypto'
import type { Client, CreateClientRequest, UpdateClientRequest } from '../domain/models.js'
import { loadBookings, loadClients, saveClients } from '../infrastructure/data.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listClients(): Client[] {
  return loadClients()
}

export function createClient(req: CreateClientRequest): Client {
  const all = loadClients()

  if (req.identityDocument !== undefined) {
    const doc = req.identityDocument.toUpperCase()
    if (all.some((c) => c.identityDocument?.toUpperCase() === doc)) {
      throw new ConflictError(`Identity document '${req.identityDocument}' already exists`)
    }
  }

  if (req.email !== undefined) {
    const emailLower = req.email.toLowerCase()
    if (all.some((c) => c.email?.toLowerCase() === emailLower)) {
      throw new ConflictError(`Email '${req.email}' already exists`)
    }
  }

  const client: Client = { id: randomUUID(), ...req }
  saveClients([...all, client])
  return client
}

export function updateClient(id: string, req: UpdateClientRequest): Client {
  const all = loadClients()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new NotFoundError(`Client '${id}' not found`)

  if (req.identityDocument !== undefined) {
    const doc = req.identityDocument.toUpperCase()
    if (all.some((c) => c.id !== id && c.identityDocument?.toUpperCase() === doc)) {
      throw new ConflictError(`Identity document '${req.identityDocument}' already exists`)
    }
  }

  if (req.email !== undefined) {
    const emailLower = req.email.toLowerCase()
    if (all.some((c) => c.id !== id && c.email?.toLowerCase() === emailLower)) {
      throw new ConflictError(`Email '${req.email}' already exists`)
    }
  }

  const updated: Client = { ...all[idx]!, ...req }
  all[idx] = updated
  saveClients(all)
  return updated
}

export function deleteClient(id: string): void {
  const all = loadClients()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new NotFoundError(`Client '${id}' not found`)

  const bookings = loadBookings()
  if (bookings.some((b) => b.clientId === id)) {
    throw new ConflictError('Cannot delete client with existing bookings')
  }

  saveClients(all.filter((c) => c.id !== id))
}
