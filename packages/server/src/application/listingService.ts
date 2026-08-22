import { randomUUID } from 'node:crypto'
import type { Listing, CreateListingRequest, UpdateListingRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as listings from '../infrastructure/repositories/listings.js'
import * as reservations from '../infrastructure/repositories/reservations.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listListings(): Listing[] {
  return listings.list()
}

export function createListing(req: CreateListingRequest): Listing {
  return transaction(() => {
    if (listings.findByName(req.name) !== null) {
      throw new ConflictError(`Listing name '${req.name}' already exists`)
    }
    const listing: Listing = { id: randomUUID(), ...req }
    listings.insert(listing)
    return listing
  })
}

export function updateListing(id: string, req: UpdateListingRequest): Listing {
  return transaction(() => {
    const existing = listings.findById(id)
    if (existing === null) throw new NotFoundError(`Listing '${id}' not found`)

    if (req.name !== undefined && listings.findByName(req.name, id) !== null) {
      throw new ConflictError(`Listing name '${req.name}' already exists`)
    }

    const updated: Listing = { ...existing, ...req }
    listings.update(updated)
    return updated
  })
}

export function deleteListing(id: string): void {
  transaction(() => {
    if (listings.findById(id) === null) throw new NotFoundError(`Listing '${id}' not found`)
    if (reservations.existsForListing(id)) {
      throw new ConflictError('Cannot delete listing with existing reservations')
    }
    listings.deleteById(id)
  })
}
