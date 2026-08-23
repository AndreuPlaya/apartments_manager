import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { securityHeaders } from '../../src/middleware/securityHeaders.js'

const app = new Hono()
app.use('*', securityHeaders)
app.get('/', (c) => c.text('ok'))

/** Over TLS, however the deployment reports it. */
const HTTPS = { headers: { 'x-forwarded-proto': 'https' } }

/** The development server: the production build over plain HTTP on an IP. */
const PLAIN = 'http://10.10.0.30:5001/'

// Headers a browser only honours on a potentially trustworthy origin. Sent over
// plain HTTP they are either rejected with a console error (COOP), dropped in
// silence (HSTS), or impossible to satisfy because a bare IP is one site across
// every port (Origin-Agent-Cluster).
const TLS_ONLY = ['cross-origin-opener-policy', 'strict-transport-security', 'origin-agent-cluster']

describe('securityHeaders', () => {
  it('sends the TLS-only headers when the connection is encrypted', async () => {
    const res = await app.request('https://portal.example.com/', HTTPS)
    for (const header of TLS_ONLY) expect(res.headers.get(header)).not.toBeNull()
  })

  it('omits them on plain HTTP, where they only produce console noise', async () => {
    const res = await app.request(PLAIN)
    for (const header of TLS_ONLY) expect(res.headers.get(header)).toBeNull()
  })

  it('trusts X-Forwarded-Proto, so TLS terminated at Caddy still counts', async () => {
    const res = await app.request(PLAIN, HTTPS)
    expect(res.headers.get('strict-transport-security')).not.toBeNull()
  })

  it('still sends the headers that work without TLS', async () => {
    const res = await app.request(PLAIN)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('cross-origin-resource-policy')).toBe('same-origin')
  })
})
