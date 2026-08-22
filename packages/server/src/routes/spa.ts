import { serveStatic } from '@hono/node-server/serve-static'
import type { Hono } from 'hono'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The single-page shell and its assets, with the cache policy that keeps a
 * deployment from being half-applied in someone's browser.
 *
 * v1.1.0 renamed the API routes and shipped with no cache headers at all on
 * `index.html`. Browsers cache a header-less HTML response by heuristic, so
 * reception kept the previous shell — and with it the previous hashed bundle,
 * calling `/api/apartments` against a server that only answers `/api/listings`.
 * The container was healthy and the deployment was correct; the browser simply
 * never asked for the new one.
 *
 * The two directives below are the whole fix, and they are opposites on purpose:
 *
 * - The shell is the one file whose name never changes, so it is the one file
 *   that must always be fetched. `no-store` means a reload always sees the
 *   deployment that is actually running.
 * - Everything under `/assets/` is named by a hash of its own content, so a
 *   changed file is a different URL. Those can be kept for a year, and should
 *   be: it is what makes an always-revalidated shell cheap.
 */
export const SHELL_CACHE_CONTROL = 'no-store'
export const ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/**
 * Serves the built client (production only — in dev the Vite server does this).
 *
 * Mount it last: the `*` fallback answers every path the API did not claim.
 */
export function mountClientApp(app: Hono, clientDist: string): void {
  // An /api/* request that gets this far matched no route. It has to end here,
  // because the fallback below would otherwise answer it with the HTML shell —
  // a 200 carrying a page where the caller expected data, which is how a
  // removed endpoint hides instead of announcing itself.
  app.all('/api/*', (c) => c.json({ error: `Unknown API endpoint: ${c.req.path}` }, 404))

  // The policy is set before serveStatic rather than in its `onFound` hook: the
  // hook runs after the response body has been built, and a header set then
  // never reaches the wire. A miss falls through to the shell below, which sets
  // its own policy over this one.
  app.use('/assets/*', async (c, next) => {
    c.header('Cache-Control', ASSET_CACHE_CONTROL)
    await next()
  })
  app.use('/assets/*', serveStatic({ root: clientDist }))

  app.get('*', (c) => {
    let html: string
    try {
      html = readFileSync(join(clientDist, 'index.html'), 'utf8')
    } catch {
      return c.text('Frontend not built. Run: pnpm build', 503)
    }
    c.header('Cache-Control', SHELL_CACHE_CONTROL)
    return c.html(html)
  })
}
