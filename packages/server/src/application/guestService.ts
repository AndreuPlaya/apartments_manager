import { randomUUID } from 'node:crypto'
import type { Guest, CreateGuestRequest, UpdateGuestRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as reservations from '../infrastructure/repositories/reservations.js'
import * as guests from '../infrastructure/repositories/guests.js'
import { ConflictError, NotFoundError } from './errors.js'

/**
 * A blank identity document or email means "not provided", not a value to be
 * held unique — the create form submits empty strings for untouched fields, and
 * every such guest would otherwise collide with the first one.
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
    if (guests.findByIdentityDocument(req.identityDocument, excludeId) !== null) {
      throw new ConflictError(`Identity document '${req.identityDocument}' already exists`)
    }
  }
  if (req.email !== undefined) {
    if (guests.findByEmail(req.email, excludeId) !== null) {
      throw new ConflictError(`Email '${req.email}' already exists`)
    }
  }
}

export function listGuests(): Guest[] {
  return guests.list()
}

export function createGuest(request: CreateGuestRequest): Guest {
  const req = blankToUndefined(request)

  return transaction(() => {
    assertUnique(req)
    const guest: Guest = { id: randomUUID(), ...req }
    guests.insert(guest)
    return guest
  })
}

export function updateGuest(id: string, request: UpdateGuestRequest): Guest {
  const req = blankToUndefined(request)

  return transaction(() => {
    const existing = guests.findById(id)
    if (existing === null) throw new NotFoundError(`Guest '${id}' not found`)

    assertUnique(req, id)

    const updated: Guest = { ...existing, ...req }
    guests.update(updated)
    return updated
  })
}

export function deleteGuest(id: string): void {
  transaction(() => {
    if (guests.findById(id) === null) throw new NotFoundError(`Guest '${id}' not found`)
    if (reservations.existsForGuest(id)) {
      throw new ConflictError('Cannot delete guest with existing reservations')
    }
    guests.deleteById(id)
  })
}
