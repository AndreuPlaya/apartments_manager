import type { Context } from 'hono'
import { AppError } from '../application/errors.js'

export function handleError(err: unknown, c: Context) {
  if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any)
  throw err
}
