import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true })
}

export function readJson<T>(filePath: string, defaultValue: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return defaultValue
    throw err
  }
}

export function writeJson<T>(filePath: string, data: T): void {
  ensureDir(dirname(filePath))
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, filePath)
}
