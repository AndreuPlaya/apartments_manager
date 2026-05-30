import { describe, expect, it } from 'vitest'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/application/errors.js'

describe('AppError', () => {
  it('sets statusCode, message, and name', () => {
    const err = new AppError(500, 'Server error')
    expect(err.statusCode).toBe(500)
    expect(err.message).toBe('Server error')
    expect(err.name).toBe('AppError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('NotFoundError', () => {
  it('uses statusCode 404 and default message', () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('NotFoundError')
  })

  it('accepts a custom message', () => {
    const err = new NotFoundError('Item missing')
    expect(err.message).toBe('Item missing')
  })
})

describe('ConflictError', () => {
  it('uses statusCode 409', () => {
    const err = new ConflictError('Already exists')
    expect(err.statusCode).toBe(409)
    expect(err.name).toBe('ConflictError')
  })
})

describe('ValidationError', () => {
  it('uses statusCode 400', () => {
    const err = new ValidationError('Invalid input')
    expect(err.statusCode).toBe(400)
    expect(err.name).toBe('ValidationError')
  })
})

describe('ForbiddenError', () => {
  it('uses statusCode 403 and default message', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Forbidden')
    expect(err.name).toBe('ForbiddenError')
  })

  it('accepts a custom message', () => {
    const err = new ForbiddenError('No access')
    expect(err.message).toBe('No access')
  })
})

describe('UnauthorizedError', () => {
  it('uses statusCode 401 and default message', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Unauthorized')
    expect(err.name).toBe('UnauthorizedError')
  })

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired')
    expect(err.message).toBe('Token expired')
  })
})
