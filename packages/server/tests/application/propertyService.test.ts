import { describe, expect, it } from 'vitest'
import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
} from '../../src/application/propertyService.js'
import type { CreatePropertyRequest } from '../../src/domain/models.js'
import * as properties from '../../src/infrastructure/repositories/properties.js'
import { useTestDb } from '../helpers/testDb.js'

useTestDb()

const req: CreatePropertyRequest = {
  name: 'Downtown Block',
  address: '2 Main St',
  rentalType: 'long-term',
  isAvailable: true,
}

describe('listProperties', () => {
  it('returns the stored properties', () => {
    const created = createProperty(req)

    expect(listProperties()).toEqual([created])
  })
})

describe('createProperty', () => {
  it('creates a property with a generated id and persists it', () => {
    const result = createProperty({ ...req, name: 'Seaside Complex' })

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Seaside Complex')
    expect(properties.findById(result.id)).toEqual(result)
  })

  it('round-trips optional fields', () => {
    const result = createProperty({ ...req, city: 'Valencia', floor: '3', door: 'B', comment: 'x' })

    expect(properties.findById(result.id)).toEqual(result)
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    createProperty(req)

    expect(() => createProperty({ ...req, name: 'downtown block' })).toThrow('already exists')
    expect(listProperties()).toHaveLength(1)
  })
})

describe('updateProperty', () => {
  it('updates a property successfully', () => {
    const created = createProperty(req)

    const result = updateProperty(created.id, { name: 'Uptown Block' })

    expect(result.name).toBe('Uptown Block')
    expect(properties.findById(created.id)!.name).toBe('Uptown Block')
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateProperty('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    const created = createProperty(req)
    createProperty({ ...req, name: 'Seaside Complex' })

    expect(() => updateProperty(created.id, { name: 'seaside complex' })).toThrow('already exists')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    const created = createProperty(req)

    expect(updateProperty(created.id, { name: 'Downtown Block' }).name).toBe('Downtown Block')
  })
})

describe('deleteProperty', () => {
  it('deletes a property', () => {
    const created = createProperty(req)

    deleteProperty(created.id)

    expect(listProperties()).toEqual([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteProperty('ghost')).toThrow('not found')
  })
})
