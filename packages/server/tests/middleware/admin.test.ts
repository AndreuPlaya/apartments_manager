import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import type { SessionUser } from '../../src/domain/models.js'
import { adminMiddleware } from '../../src/middleware/admin.js'

function makeApp(user: SessionUser) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })
  app.use('*', adminMiddleware)
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

describe('adminMiddleware', () => {
  it('returns 403 when the user is not an admin', async () => {
    const app = makeApp({ username: 'alice', isAdmin: false, resourceId: 'uuid-1' })
    const res = await app.request('/test')
    expect(res.status).toBe(403)
  })

  it('calls next and returns 200 when the user is an admin', async () => {
    const app = makeApp({ username: 'admin', isAdmin: true, resourceId: null })
    const res = await app.request('/test')
    expect(res.status).toBe(200)
  })
})
