import { Hono } from 'hono'
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../infrastructure/settings.js')
import { findUser, getSecret } from '../infrastructure/settings.js'

import { authMiddleware } from './auth.js'

const SECRET = new TextEncoder().encode('test-secret')

beforeEach(() => {
  vi.mocked(getSecret).mockReturnValue(SECRET)
  vi.mocked(findUser).mockReturnValue({ type: 'admin', username: 'admin', record: { password_hash: 'x', full_name: 'Admin' } })
})

function makeApp() {
  const app = new Hono()
  app.use('*', authMiddleware)
  app.get('/test', (c) => {
    const user = c.get('user')
    return c.json({ username: user.username, isAdmin: user.isAdmin, resourceId: user.resourceId })
  })
  return app
}

async function makeToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

describe('authMiddleware', () => {
  it('returns 401 when no session cookie is present', async () => {
    const app = makeApp()
    const res = await app.request('/test')
    expect(res.status).toBe(401)
  })

  it('returns 401 for an invalid token', async () => {
    const app = makeApp()
    const res = await app.request('/test', {
      headers: { Cookie: 'session=not.a.valid.token' },
    })
    expect(res.status).toBe(401)
  })

  it('sets user in context and calls next for a valid token', async () => {
    const app = makeApp()
    const token = await makeToken({ username: 'admin', isAdmin: true, resourceId: null })
    const res = await app.request('/test', {
      headers: { Cookie: `session=${token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.username).toBe('admin')
    expect(body.isAdmin).toBe(true)
    expect(body.resourceId).toBeNull()
  })

  it('returns 401 when user no longer exists in settings', async () => {
    vi.mocked(findUser).mockReturnValue(null)
    const app = makeApp()
    const token = await makeToken({ username: 'ghost', isAdmin: false, resourceId: null })
    const res = await app.request('/test', {
      headers: { Cookie: `session=${token}` },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 when user account is disabled', async () => {
    vi.mocked(findUser).mockReturnValue({ type: 'user', id: 'u1', record: { username: 'bob', password_hash: 'x', full_name: 'Bob', enabled: false } })
    const app = makeApp()
    const token = await makeToken({ username: 'bob', isAdmin: false, resourceId: 'u1' })
    const res = await app.request('/test', {
      headers: { Cookie: `session=${token}` },
    })
    expect(res.status).toBe(401)
  })

  it('sets resourceId from token payload', async () => {
    vi.mocked(findUser).mockReturnValue({ type: 'user', id: 'user-uuid-1', record: { username: 'alice', password_hash: 'x', full_name: 'Alice', enabled: true } })
    const app = makeApp()
    const token = await makeToken({ username: 'alice', isAdmin: false, resourceId: 'user-uuid-1' })
    const res = await app.request('/test', {
      headers: { Cookie: `session=${token}` },
    })
    const body = await res.json()
    expect(body.resourceId).toBe('user-uuid-1')
  })
})
