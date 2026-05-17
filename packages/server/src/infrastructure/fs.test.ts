import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensureDir, readJson, writeJson } from './fs.js'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'apts-test-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('readJson', () => {
  it('returns defaultValue when file does not exist', () => {
    const result = readJson(join(dir, 'missing.json'), { x: 42 })
    expect(result).toEqual({ x: 42 })
  })

  it('returns parsed content of existing file', () => {
    const path = join(dir, 'data.json')
    writeJson(path, { hello: 'world' })
    const result = readJson(path, {})
    expect(result).toEqual({ hello: 'world' })
  })

  it('throws on malformed JSON', async () => {
    const { writeFileSync } = await import('node:fs')
    const path = join(dir, 'bad.json')
    writeFileSync(path, '{ not valid json }', 'utf8')
    expect(() => readJson(path, {})).toThrow()
  })
})

describe('writeJson', () => {
  it('writes and can be read back', () => {
    const path = join(dir, 'out.json')
    const data = [1, 2, 3]
    writeJson(path, data)
    const back = readJson(path, [])
    expect(back).toEqual(data)
  })

  it('creates parent directories that do not exist', () => {
    const path = join(dir, 'nested', 'deep', 'file.json')
    writeJson(path, { ok: true })
    const back = readJson(path, {})
    expect(back).toEqual({ ok: true })
  })

  it('leaves no .tmp file after successful write', () => {
    const path = join(dir, 'atomic.json')
    writeJson(path, { atomic: true })
    expect(existsSync(path + '.tmp')).toBe(false)
  })

  it('overwrites an existing file', () => {
    const path = join(dir, 'existing.json')
    writeJson(path, { v: 1 })
    writeJson(path, { v: 2 })
    expect(readJson(path, {})).toEqual({ v: 2 })
  })
})

describe('ensureDir', () => {
  it('creates a directory that does not exist', () => {
    const path = join(dir, 'new-dir', 'nested')
    ensureDir(path)
    expect(existsSync(path)).toBe(true)
  })

  it('is a no-op when directory already exists', () => {
    expect(() => ensureDir(dir)).not.toThrow()
  })
})
