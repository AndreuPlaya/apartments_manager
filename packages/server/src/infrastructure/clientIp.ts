import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'

/**
 * Number of reverse proxies in front of this app, from `TRUST_PROXY`.
 *
 * `X-Forwarded-For` is client-controlled: anything to the left of the hop our
 * own proxy appended can be forged. Trusting the whole header lets an attacker
 * rotate a fake IP per request and evade the login rate limit entirely, so we
 * only trust exactly as many rightmost entries as there are proxies we know
 * about, and default to 0 — i.e. use the real socket address and ignore the
 * header — when nothing is configured.
 *
 * Deployment: this app sits behind one Caddy instance, so `TRUST_PROXY=1`
 * (set in compose.yaml). Add another proxy in front → raise the number.
 */
function trustedProxyCount(): number {
  const n = Number.parseInt(process.env['TRUST_PROXY'] ?? '0', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Whether the connection that will carry a cookie back to the browser is
 * encrypted — the only honest basis for the `Secure` attribute.
 *
 * It used to be `NODE_ENV === 'production'`, which is a statement about the
 * build, not about the connection. The development server runs the production
 * build over plain HTTP on port 5001, so it marked its session cookie `Secure`
 * and the browser silently refused to keep it: the login succeeded, and every
 * request after it came back 401.
 *
 * `X-Forwarded-Proto` is what our own proxy reports, and Caddy overwrites
 * whatever the client sent. A forged value can only cost the forger their own
 * session, never expose anyone else's: marking a cookie `Secure` on a plain
 * connection makes the browser drop it, and dropping the attribute cannot make
 * a browser send a cookie it never stored.
 */
export function isSecureRequest(c: Context): boolean {
  const proto = c.req.header('x-forwarded-proto')
  // Leftmost is the protocol the outermost proxy was spoken to.
  if (proto) return proto.split(',')[0]!.trim().toLowerCase() === 'https'
  return new URL(c.req.url).protocol === 'https:'
}

/**
 * Resolve the client IP to key rate limits on.
 *
 * With `TRUST_PROXY=n` we take the n-th entry from the right of
 * `X-Forwarded-For` — the address our outermost trusted proxy observed. With
 * `TRUST_PROXY=0` the header is ignored completely.
 */
export function clientIp(c: Context): string {
  const hops = trustedProxyCount()
  if (hops > 0) {
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) {
      const chain = forwarded
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      // Fewer entries than configured hops means the header was not appended by
      // every proxy we expect; fall back to the leftmost one we did get.
      const ip = chain[Math.max(0, chain.length - hops)]
      if (ip) return ip
    }
  }
  return socketAddress(c) ?? 'unknown'
}

/**
 * The socket address, or undefined when there is none to read.
 *
 * `getConnInfo` reaches into the Node request bound to the context and throws
 * if it is absent — the case for `app.request()` and for any runtime other than
 * @hono/node-server. This runs inside a rate-limiter keyGenerator, where
 * throwing fails the request outright, so an unreadable address degrades to a
 * shared 'unknown' bucket: more restrictive, never less.
 */
function socketAddress(c: Context): string | undefined {
  try {
    return getConnInfo(c).remote.address
  } catch {
    return undefined
  }
}
