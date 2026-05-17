import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { jwtVerify, SignJWT } from 'jose'
import type { Context } from 'hono'
import { AppError } from '../application/errors.js'
import { authenticate, createUser } from '../application/userService.js'
import { getSecret, isFirstRun } from '../infrastructure/settings.js'

const authRoutes = new Hono()

async function issueSessionCookie(
  c: Context,
  username: string,
  isAdmin: boolean,
  resourceId: string | null,
): Promise<void> {
  const token = await new SignJWT({ username, isAdmin, resourceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())

  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 604_800,
  })
}

authRoutes.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json<{ username?: string; password?: string }>()
    if (!body.username || !body.password) {
      return c.json({ error: 'username and password are required' }, 400)
    }
    const session = await authenticate({ username: body.username, password: body.password })
    await issueSessionCookie(c, session.username, session.isAdmin, session.resourceId)
    return c.json({ ok: true, is_admin: session.isAdmin, username: session.username })
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any)
    throw err
  }
})

authRoutes.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ ok: true })
})

authRoutes.get('/api/auth/config', async (c) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ ok: false }, 401)

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return c.json({
      ok: true,
      is_admin: payload['isAdmin'] as boolean,
      username: payload['username'] as string,
    })
  } catch {
    return c.json({ ok: false }, 401)
  }
})

authRoutes.post('/api/auth/setup', async (c) => {
  try {
    if (!isFirstRun()) return c.json({ error: 'Setup already complete' }, 409)

    const body = await c.req.json<{ username?: string; password?: string; full_name?: string }>()
    if (!body.username || !body.password || !body.full_name) {
      return c.json({ error: 'username, password, and full_name are required' }, 400)
    }

    await createUser({ username: body.username, password: body.password, full_name: body.full_name, isAdmin: true })
    return c.json({ ok: true }, 201)
  } catch (err) {
    if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any)
    throw err
  }
})

export default authRoutes
