import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hono/node-server/conninfo')

import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'
import { clientIp, isSecureRequest } from '../../src/infrastructure/clientIp.js'

const mockGetConnInfo = vi.mocked(getConnInfo)

/** Minimal Context stand-in: these functions read headers and the URL. */
function ctx(headers: Record<string, string> = {}, url = 'http://10.10.0.30:5001/api/auth/login'): Context {
  return {
    req: { header: (name: string) => headers[name.toLowerCase()], url },
  } as unknown as Context
}

function socketIs(address: string | undefined): void {
  mockGetConnInfo.mockReturnValue({ remote: { address } } as ReturnType<typeof getConnInfo>)
}

const originalTrustProxy = process.env['TRUST_PROXY']

beforeEach(() => {
  vi.resetAllMocks()
  socketIs('198.51.100.9')
})

afterEach(() => {
  process.env['TRUST_PROXY'] = originalTrustProxy
})

describe('clientIp', () => {
  describe('with no trusted proxies (TRUST_PROXY unset or 0)', () => {
    it('ignores X-Forwarded-For entirely and uses the socket address', () => {
      delete process.env['TRUST_PROXY']
      expect(clientIp(ctx({ 'x-forwarded-for': '1.2.3.4' }))).toBe('198.51.100.9')
    })

    it('ignores a forged header when TRUST_PROXY is explicitly 0', () => {
      process.env['TRUST_PROXY'] = '0'
      expect(clientIp(ctx({ 'x-forwarded-for': '1.2.3.4' }))).toBe('198.51.100.9')
    })

    it('treats a non-numeric TRUST_PROXY as untrusted', () => {
      process.env['TRUST_PROXY'] = 'yes'
      expect(clientIp(ctx({ 'x-forwarded-for': '1.2.3.4' }))).toBe('198.51.100.9')
    })

    it('falls back to "unknown" when the socket address is unavailable', () => {
      delete process.env['TRUST_PROXY']
      socketIs(undefined)
      expect(clientIp(ctx())).toBe('unknown')
    })

    // getConnInfo throws when no Node request is bound to the context. This runs
    // inside a rate-limiter keyGenerator, so throwing would fail the request.
    it('falls back to "unknown" when connection info cannot be read', () => {
      delete process.env['TRUST_PROXY']
      mockGetConnInfo.mockImplementation(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'server')")
      })
      expect(() => clientIp(ctx())).not.toThrow()
      expect(clientIp(ctx())).toBe('unknown')
    })
  })

  describe('with one trusted proxy', () => {
    beforeEach(() => {
      process.env['TRUST_PROXY'] = '1'
    })

    it('uses the single forwarded address', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7')
    })

    // The key property: a client that pre-seeds the header cannot pick its own
    // rate-limit bucket, because only the hop our own proxy appended counts.
    it('takes the rightmost hop, not a client-supplied prefix', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' }))).toBe('203.0.113.7')
    })

    it('trims whitespace around entries', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': '  203.0.113.7  ' }))).toBe('203.0.113.7')
    })

    it('falls back to the socket address when the header is absent', () => {
      expect(clientIp(ctx())).toBe('198.51.100.9')
    })

    it('falls back to the socket address when the header is empty', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': ' , ' }))).toBe('198.51.100.9')
    })

    it('still answers when the header is absent and the socket is unreadable', () => {
      mockGetConnInfo.mockImplementation(() => {
        throw new TypeError('no conn info')
      })
      expect(clientIp(ctx())).toBe('unknown')
    })
  })

  describe('with two trusted proxies', () => {
    beforeEach(() => {
      process.env['TRUST_PROXY'] = '2'
    })

    it('skips both proxy hops and returns the client address', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }))).toBe('10.0.0.1')
    })

    it('uses the leftmost entry when there are fewer hops than configured', () => {
      expect(clientIp(ctx({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7')
    })
  })
})

describe('isSecureRequest', () => {
  it('is true when our proxy says the client spoke https', () => {
    expect(isSecureRequest(ctx({ 'x-forwarded-proto': 'https' }))).toBe(true)
  })

  it('is false when our proxy says the client spoke http', () => {
    expect(isSecureRequest(ctx({ 'x-forwarded-proto': 'http' }))).toBe(false)
  })

  it('reads the leftmost hop, which is the one the client reached', () => {
    expect(isSecureRequest(ctx({ 'x-forwarded-proto': 'https, http' }))).toBe(true)
    expect(isSecureRequest(ctx({ 'x-forwarded-proto': 'http, https' }))).toBe(false)
  })

  it('does not care how the header is cased', () => {
    expect(isSecureRequest(ctx({ 'x-forwarded-proto': 'HTTPS' }))).toBe(true)
  })

  it('falls back to the request URL with no proxy in front — the development server', () => {
    expect(isSecureRequest(ctx({}, 'http://10.10.0.30:5001/api/auth/login'))).toBe(false)
    expect(isSecureRequest(ctx({}, 'https://pms.example.org/api/auth/login'))).toBe(true)
  })
})
