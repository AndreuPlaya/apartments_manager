import { Hono } from 'hono'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { relative, join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ASSET_CACHE_CONTROL, SHELL_CACHE_CONTROL, mountClientApp } from '../../src/routes/spa.js'

/**
 * The regression these tests exist for: v1.1.0 renamed the API routes and the
 * shell was served with no cache headers, so browsers kept the previous bundle
 * and called endpoints that no longer existed against a perfectly healthy
 * container.
 */

let dist: string
let app: Hono

/** serveStatic resolves its root against the cwd, so the fixture goes in relative. */
function relativeToCwd(path: string): string {
  return relative(process.cwd(), path)
}

beforeAll(() => {
  dist = mkdtempSync(join(tmpdir(), 'spa-dist-'))
  mkdirSync(join(dist, 'assets'))
  writeFileSync(join(dist, 'index.html'), '<!doctype html><title>app</title>')
  writeFileSync(join(dist, 'assets', 'index-abc123.js'), 'console.log(1)')

  app = new Hono()
  app.get('/api/listings', (c) => c.json([{ id: 'l1' }]))
  mountClientApp(app, relativeToCwd(dist))
})

afterAll(() => {
  rmSync(dist, { recursive: true, force: true })
})

describe('the SPA shell', () => {
  it('is never stored, so a reload always sees the running deployment', async () => {
    const res = await app.request('/calendar')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(SHELL_CACHE_CONTROL)
    expect(SHELL_CACHE_CONTROL).toBe('no-store')
    expect(await res.text()).toContain('<title>app</title>')
  })

  it('answers the bare root the same way', async () => {
    const res = await app.request('/')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('reports a missing build instead of pretending to serve one', async () => {
    const empty = new Hono()
    mountClientApp(empty, relativeToCwd(join(dist, 'nope')))

    const res = await empty.request('/')

    expect(res.status).toBe(503)
    expect(await res.text()).toContain('pnpm build')
  })
})

describe('hashed assets', () => {
  it('are cached for a year, which is what makes the shell cheap to revalidate', async () => {
    const res = await app.request('/assets/index-abc123.js')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(ASSET_CACHE_CONTROL)
    expect(ASSET_CACHE_CONTROL).toContain('immutable')
  })

  it('fall through to the shell when the file is gone, without its cache policy', async () => {
    const res = await app.request('/assets/index-deleted.js')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('unknown API endpoints', () => {
  it('404 instead of being answered with the HTML shell', async () => {
    const res = await app.request('/api/apartments')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Unknown API endpoint: /api/apartments' })
  })

  it('404 for writes too, so a stale bundle cannot appear to have saved', async () => {
    const res = await app.request('/api/bookings', { method: 'POST' })

    expect(res.status).toBe(404)
  })

  it('leave the routes that do exist alone', async () => {
    const res = await app.request('/api/listings')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'l1' }])
  })
})
