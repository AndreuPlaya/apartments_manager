import type { SQLInputValue } from 'node:sqlite'

/** A row as returned by node:sqlite, keyed by column name. */
export type Row = Record<string, unknown>

/** SQLite has no boolean type; the schema stores 0/1 under a CHECK constraint. */
export function toBool(value: unknown): boolean {
  return value === 1
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0
}

/** Absent optional fields are NULL in SQLite but `undefined` in the domain models. */
export function opt<T>(value: unknown): T | undefined {
  return value === null || value === undefined ? undefined : (value as T)
}

export function toParam(value: string | number | boolean | undefined): SQLInputValue {
  if (value === undefined) return null
  if (typeof value === 'boolean') return fromBool(value)
  return value
}
