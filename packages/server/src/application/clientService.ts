import { randomUUID } from 'node:crypto'
import type { Client, CreateClientRequest, UpdateClientRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as bookings from '../infrastructure/repositories/bookings.js'
import * as clients from '../infrastructure/repositories/clients.js'
import { ConflictError, NotFoundError } from './errors.js'

/**
 * A blank identity document or email means "not provided", not a value to be
 * held unique — the create form submits empty strings for untouched fields, and
 * every such client would otherwise collide with the first one.
 */
function blankToUndefined<T extends { identityDocument?: string; email?: string }>(req: T): T {
  const out = { ...req }
  if (out.identityDocument !== undefined && out.identityDocument.trim() === '') {
    out.identityDocument = undefined
  }
  if (out.email !== undefined && out.email.trim() === '') out.email = undefined
  return out
}

function assertUnique(req: { identityDocument?: string; email?: string }, excludeId?: string): void {
  if (req.identityDocument !== undefined) {
    if (clients.findByIdentityDocument(req.identityDocument, excludeId) !== null) {
      throw new ConflictError(`Identity document '${req.identityDocument}' already exists`)
    }
  }
  if (req.email !== undefined) {
    if (clients.findByEmail(req.email, excludeId) !== null) {
      throw new ConflictError(`Email '${req.email}' already exists`)
    }
  }
}

export function listClients(): Client[] {
  return clients.list()
}

export function createClient(request: CreateClientRequest): Client {
  const req = blankToUndefined(request)

  return transaction(() => {
    assertUnique(req)
    const client: Client = { id: randomUUID(), ...req }
    clients.insert(client)
    return client
  })
}

export function updateClient(id: string, request: UpdateClientRequest): Client {
  const req = blankToUndefined(request)

  return transaction(() => {
    const existing = clients.findById(id)
    if (existing === null) throw new NotFoundError(`Client '${id}' not found`)

    assertUnique(req, id)

    const updated: Client = { ...existing, ...req }
    clients.update(updated)
    return updated
  })
}

export function deleteClient(id: string): void {
  transaction(() => {
    if (clients.findById(id) === null) throw new NotFoundError(`Client '${id}' not found`)
    if (bookings.existsForClient(id)) {
      throw new ConflictError('Cannot delete client with existing bookings')
    }
    clients.deleteById(id)
  })
}
