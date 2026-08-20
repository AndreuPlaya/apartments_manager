import { randomUUID } from 'node:crypto'
import type { CreatePropertyRequest, Property, UpdatePropertyRequest } from '../domain/models.js'
import { transaction } from '../infrastructure/db.js'
import * as properties from '../infrastructure/repositories/properties.js'
import { ConflictError, NotFoundError } from './errors.js'

export function listProperties(): Property[] {
  return properties.list()
}

export function createProperty(req: CreatePropertyRequest): Property {
  return transaction(() => {
    if (properties.findByName(req.name) !== null) {
      throw new ConflictError(`Property name '${req.name}' already exists`)
    }
    const property: Property = { id: randomUUID(), ...req }
    properties.insert(property)
    return property
  })
}

export function updateProperty(id: string, req: UpdatePropertyRequest): Property {
  return transaction(() => {
    const existing = properties.findById(id)
    if (existing === null) throw new NotFoundError(`Property '${id}' not found`)

    if (req.name !== undefined && properties.findByName(req.name, id) !== null) {
      throw new ConflictError(`Property name '${req.name}' already exists`)
    }

    const updated: Property = { ...existing, ...req }
    properties.update(updated)
    return updated
  })
}

export function deleteProperty(id: string): void {
  transaction(() => {
    if (properties.findById(id) === null) throw new NotFoundError(`Property '${id}' not found`)
    properties.deleteById(id)
  })
}
