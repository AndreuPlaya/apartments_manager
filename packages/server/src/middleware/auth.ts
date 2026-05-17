import { getCookie } from 'hono/cookie'
import { jwtVerify } from 'jose'
import type { MiddlewareHandler } from 'hono'
import type { SessionUser } from '../domain/models.js'
import { getSecret } from '../infrastructure/settings.js'

declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const { payload } = await jwtVerify(token, getSecret())
    c.set('user', {
      username: payload['username'] as string,
      isAdmin: payload['isAdmin'] as boolean,
      resourceId: (payload['resourceId'] as string | null) ?? null,
    })
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
