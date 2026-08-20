import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hono/node-server/conninfo')

import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'
import { clientIp } from '../../src/infrastructure/clientIp.js'

const mockGetConnInfo = vi.mocked(getConnInfo)

/** Minimal Context stand-in: clientIp only reads one header. */
function ctx(headers: Record<string, string> = {}): Context {
  return {
    req: { header: (name: string) => headers[name.toLowerCase()] },
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
