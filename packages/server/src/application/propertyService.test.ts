import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Property } from '../domain/models.js'

vi.mock('../infrastructure/data.js')
import {
  loadProperties,
  saveProperties,
} from '../infrastructure/data.js'

import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
} from './propertyService.js'

const prop: Property = {
  id: 'prop1',
  name: 'Downtown Block',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(loadProperties).mockReturnValue([prop])
  vi.mocked(saveProperties).mockImplementation(() => undefined)
})

describe('listProperties', () => {
  it('returns what loadProperties returns', () => {
    expect(listProperties()).toEqual([prop])
  })
})

describe('createProperty', () => {
  it('creates a property with a generated id', () => {
    vi.mocked(loadProperties).mockReturnValue([])
    const result = createProperty({ name: 'Seaside Complex' })
    expect(result.id).toBeDefined()
    expect(result.name).toBe('Seaside Complex')
    expect(saveProperties).toHaveBeenCalledOnce()
  })

  it('throws ConflictError on duplicate name (case-insensitive)', () => {
    expect(() => createProperty({ name: 'downtown block' })).toThrow('already exists')
  })
})

describe('updateProperty', () => {
  it('updates a property successfully', () => {
    const result = updateProperty('prop1', { name: 'Uptown Block' })
    expect(result.name).toBe('Uptown Block')
    expect(saveProperties).toHaveBeenCalledOnce()
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => updateProperty('ghost', {})).toThrow('not found')
  })

  it('throws ConflictError when renaming to an existing name', () => {
    vi.mocked(loadProperties).mockReturnValue([
      prop,
      { id: 'prop2', name: 'Seaside Complex' },
    ])
    expect(() => updateProperty('prop1', { name: 'seaside complex' })).toThrow('already exists')
  })

  it('allows updating name to the same name (no conflict with self)', () => {
    const result = updateProperty('prop1', { name: 'Downtown Block' })
    expect(result.name).toBe('Downtown Block')
  })
})

describe('deleteProperty', () => {
  it('deletes a property', () => {
    deleteProperty('prop1')
    expect(saveProperties).toHaveBeenCalledWith([])
  })

  it('throws NotFoundError for unknown id', () => {
    expect(() => deleteProperty('ghost')).toThrow('not found')
  })
})
