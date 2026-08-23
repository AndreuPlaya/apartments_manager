import { secureHeaders } from 'hono/secure-headers'
import type { MiddlewareHandler } from 'hono'
import { isSecureRequest } from '../infrastructure/clientIp.js'

/**
 * The full set, for a connection that can carry it.
 */
const overTls = secureHeaders()

/**
 * The same set minus the three headers a browser can only honour over TLS.
 * Sending them on a plain-HTTP origin is not free — it fills the console with
 * complaints that read like faults in the application:
 *
 * - `Cross-Origin-Opener-Policy` is rejected outright unless the origin is
 *   potentially trustworthy (HTTPS, or `localhost`). The development server is
 *   neither: it answers on `http://<ip>:5001`.
 * - `Strict-Transport-Security` is discarded in silence over plain HTTP.
 * - `Origin-Agent-Cluster` cannot be satisfied there either. A bare IP is one
 *   *site* across every port while each port is its own *origin*, so dev and
 *   production share a cluster key: whichever the browser loaded first decides
 *   it, and the second is told it asked too late.
 */
const overPlainHttp = secureHeaders({
  crossOriginOpenerPolicy: false,
  strictTransportSecurity: false,
  originAgentCluster: false,
})

/**
 * Security headers, chosen by what the connection can actually deliver rather
 * than by what the build thinks it is — the same reasoning that decides the
 * session cookie's `Secure` attribute. See isSecureRequest().
 *
 * Everything that works without TLS (`X-Content-Type-Options`,
 * `X-Frame-Options`, `Referrer-Policy`, CORP, …) is sent either way.
 */
export const securityHeaders: MiddlewareHandler = (c, next) =>
  (isSecureRequest(c) ? overTls : overPlainHttp)(c, next)
