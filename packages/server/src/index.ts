import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureSecretKey, isFirstRun } from './infrastructure/settings.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import editorRoutes from './routes/editor.js'

ensureSecretKey()

const app = new Hono()

app.use('*', secureHeaders())
app.use('/api/*', bodyLimit({ maxSize: 512 * 1024 }))

// First-run guard — all non-auth API routes return 503 until an admin is created
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth')) return next()
  if (isFirstRun()) return c.json({ setupRequired: true }, 503)
  return next()
})

app.route('/', authRoutes)
app.route('/', editorRoutes)
app.route('/', adminRoutes)

// Static files + SPA fallback (production only — in dev the Vite server handles this)
const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')
// Go up 3 levels: dist → server → packages → repo root, then into packages/client/dist
// This works both in local dev (packages/server/dist) and Docker (packages/server/dist)
const CLIENT_DIST = join(__dirname, '..', '..', '..', 'packages', 'client', 'dist')

try {
  app.use('/assets/*', serveStatic({ root: CLIENT_DIST }))
  app.get('*', (c) => {
    try {
      const html = readFileSync(join(CLIENT_DIST, 'index.html'), 'utf8')
      return c.html(html)
    } catch {
      return c.text('Frontend not built. Run: pnpm build', 503)
    }
  })
} catch {
  // serveStatic may fail if dist doesn't exist; SPA fallback handles it gracefully
}

const PORT = Number(process.env['PORT'] ?? 5000)
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' })
console.log(`Server running on http://0.0.0.0:${PORT}`)
