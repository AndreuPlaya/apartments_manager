import { Hono } from 'hono'
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../application/userService.js')
vi.mock('../infrastructure/settings.js')

import { authenticate, createUser } from '../application/userService.js'
import { getSecret, isFirstRun } from '../infrastructure/settings.js'
import { ConflictError, UnauthorizedError } from '../application/errors.js'

import authRoutes from './auth.js'

const SECRET = new TextEncoder().encode('test-secret')

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSecret).mockReturnValue(SECRET)
  vi.mocked(isFirstRun).mockReturnValue(true)
})

function makeApp() {
  const app = new Hono()
  app.route('/', authRoutes)
  return app
}

async function makeToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

describe('POST /api/auth/login', () => {
  it('returns 400 when username is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'pass' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 401 when authenticate throws UnauthorizedError', async () => {
    vi.mocked(authenticate).mockRejectedValue(new UnauthorizedError('Invalid credentials'))
    const app = makeApp()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 and sets session cookie on success', async () => {
    vi.mocked(authenticate).mockResolvedValue({ username: 'admin', isAdmin: true, resourceId: null })
    const app = makeApp()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.is_admin).toBe(true)
    expect(res.headers.get('set-cookie')).toContain('session=')
  })

  it('returns 500 when login throws a non-AppError (Hono handles it)', async () => {
    vi.mocked(authenticate).mockRejectedValue(new Error('Unexpected DB failure'))
    const app = makeApp()
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pass' }),
    })
    expect(res.status).toBe(500)
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the session cookie', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(res.headers.get('set-cookie')).toContain('session=')
  })
})

describe('GET /api/auth/config', () => {
  it('returns 401 when no session cookie', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/config')
    expect(res.status).toBe(401)
  })

  it('returns 401 for invalid token', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/config', {
      headers: { Cookie: 'session=invalid.token' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 with user info for valid token', async () => {
    const token = await makeToken({ username: 'admin', isAdmin: true })
    const app = makeApp()
    const res = await app.request('/api/auth/config', {
      headers: { Cookie: `session=${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.is_admin).toBe(true)
    expect(body.username).toBe('admin')
  })
})

describe('POST /api/auth/setup', () => {
  it('returns 409 when setup is already complete', async () => {
    vi.mocked(isFirstRun).mockReturnValue(false)
    const app = makeApp()
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin' }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when required fields are missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 when createUser throws ConflictError', async () => {
    vi.mocked(createUser).mockRejectedValue(new ConflictError('Username already exists'))
    const app = makeApp()
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin' }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 201 on success', async () => {
    vi.mocked(createUser).mockResolvedValue({
      id: 'admin', username: 'admin', full_name: 'Admin', isAdmin: true, enabled: true,
    })
    const app = makeApp()
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin' }),
    })
    expect(res.status).toBe(201)
  })

  it('returns 500 when setup throws a non-AppError (Hono handles it)', async () => {
    vi.mocked(createUser).mockRejectedValue(new Error('Unexpected failure'))
    const app = makeApp()
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pass12345', full_name: 'Admin' }),
    })
    expect(res.status).toBe(500)
  })
})
