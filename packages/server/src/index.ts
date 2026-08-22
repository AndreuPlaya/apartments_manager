import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importLegacyJson } from './infrastructure/importJson.js'
import { ensureSecretKey, isFirstRun } from './infrastructure/settings.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import editorRoutes from './routes/editor.js'
import { mountClientApp } from './routes/spa.js'

ensureSecretKey()

// Opens the database, applies pending migrations and, on the first boot after
// the SQLite switch, imports the legacy JSON files.
const migration = importLegacyJson()
if (migration.imported) {
  console.log('Imported legacy JSON data into SQLite:', migration.counts)
}

const app = new Hono()

app.use('*', secureHeaders())
app.use('/api/*', bodyLimit({ maxSize: 512 * 1024 }))

// Liveness probe: unauthenticated, and answers before setup is complete so a
// fresh deployment reports healthy while it waits for its first admin.
app.get('/api/health', (c) => c.json({ ok: true }))

// First-run guard — all non-auth API routes return 503 until an admin is created
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth') || c.req.path === '/api/health') return next()
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

mountClientApp(app, CLIENT_DIST)

const PORT = Number(process.env['PORT'] ?? 5000)
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' })
console.log(`Server running on http://0.0.0.0:${PORT}`)
