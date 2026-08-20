import { randomUUID } from 'node:crypto'
import type { Apartment, CreateApartmentRequest, UpdateApartmentRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as apartments from '../infrastructure/repositories/apartments.js'
import * as bookings from '../infrastructure/repositories/bookings.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listApartments(): Apartment[] {
  return apartments.list()
}

export function createApartment(req: CreateApartmentRequest): Apartment {
  return transaction(() => {
    if (apartments.findByName(req.name) !== null) {
      throw new ConflictError(`Apartment name '${req.name}' already exists`)
    }
    const apartment: Apartment = { id: randomUUID(), ...req }
    apartments.insert(apartment)
    return apartment
  })
}

export function updateApartment(id: string, req: UpdateApartmentRequest): Apartment {
  return transaction(() => {
    const existing = apartments.findById(id)
    if (existing === null) throw new NotFoundError(`Apartment '${id}' not found`)

    if (req.name !== undefined && apartments.findByName(req.name, id) !== null) {
      throw new ConflictError(`Apartment name '${req.name}' already exists`)
    }

    const updated: Apartment = { ...existing, ...req }
    apartments.update(updated)
    return updated
  })
}

export function deleteApartment(id: string): void {
  transaction(() => {
    if (apartments.findById(id) === null) throw new NotFoundError(`Apartment '${id}' not found`)
    if (bookings.existsForApartment(id)) {
      throw new ConflictError('Cannot delete apartment with existing bookings')
    }
    apartments.deleteById(id)
  })
}
