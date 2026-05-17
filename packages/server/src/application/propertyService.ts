import { randomUUID } from 'node:crypto'
import type { CreatePropertyRequest, Property, UpdatePropertyRequest } from '../domain/models.js'
import { loadProperties, saveProperties } from '../infrastructure/data.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listProperties(): Property[] {
  return loadProperties()
}

export function createProperty(req: CreatePropertyRequest): Property {
  const all = loadProperties()
  const nameLower = req.name.toLowerCase()
  if (all.some((p) => p.name.toLowerCase() === nameLower)) {
    throw new ConflictError(`Property name '${req.name}' already exists`)
  }
  const property: Property = { id: randomUUID(), ...req }
  saveProperties([...all, property])
  return property
}

export function updateProperty(id: string, req: UpdatePropertyRequest): Property {
  const all = loadProperties()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) throw new NotFoundError(`Property '${id}' not found`)

  if (req.name !== undefined) {
    const nameLower = req.name.toLowerCase()
    if (all.some((p) => p.id !== id && p.name.toLowerCase() === nameLower)) {
      throw new ConflictError(`Property name '${req.name}' already exists`)
    }
  }

  const updated: Property = { ...all[idx]!, ...req }
  all[idx] = updated
  saveProperties(all)
  return updated
}

export function deleteProperty(id: string): void {
  const all = loadProperties()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) throw new NotFoundError(`Property '${id}' not found`)
  saveProperties(all.filter((p) => p.id !== id))
}
