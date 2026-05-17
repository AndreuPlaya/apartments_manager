import type { MiddlewareHandler } from 'hono'

export const adminMiddleware: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')
  if (!user.isAdmin) return c.json({ error: 'Forbidden' }, 403)
  await next()
}
