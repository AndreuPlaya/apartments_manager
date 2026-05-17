import { randomUUID } from 'node:crypto'
import type { Apartment, CreateApartmentRequest, UpdateApartmentRequest } from '../domain/models.js'
import { loadApartments, loadBookings, saveApartments } from '../infrastructure/data.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listApartments(): Apartment[] {
  return loadApartments()
}

export function createApartment(req: CreateApartmentRequest): Apartment {
  const all = loadApartments()
  const nameLower = req.name.toLowerCase()
  if (all.some((a) => a.name.toLowerCase() === nameLower)) {
    throw new ConflictError(`Apartment name '${req.name}' already exists`)
  }
  const apartment: Apartment = { id: randomUUID(), ...req }
  saveApartments([...all, apartment])
  return apartment
}

export function updateApartment(id: string, req: UpdateApartmentRequest): Apartment {
  const all = loadApartments()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) throw new NotFoundError(`Apartment '${id}' not found`)

  if (req.name !== undefined) {
    const nameLower = req.name.toLowerCase()
    if (all.some((a) => a.id !== id && a.name.toLowerCase() === nameLower)) {
      throw new ConflictError(`Apartment name '${req.name}' already exists`)
    }
  }

  const updated: Apartment = { ...all[idx]!, ...req }
  all[idx] = updated
  saveApartments(all)
  return updated
}

export function deleteApartment(id: string): void {
  const all = loadApartments()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) throw new NotFoundError(`Apartment '${id}' not found`)

  const bookings = loadBookings()
  if (bookings.some((b) => b.apartmentId === id)) {
    throw new ConflictError('Cannot delete apartment with existing bookings')
  }

  saveApartments(all.filter((a) => a.id !== id))
}
