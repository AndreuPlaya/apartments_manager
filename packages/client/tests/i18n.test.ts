import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// getStartLocale() runs once at import time, so each case needs a fresh module
// registry with the globals it is meant to read already in place.
async function loadI18n() {
  vi.resetModules()
  const mod = await import('../src/i18n')
  return mod.i18n
}

function stubStorage(saved: string | null) {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => saved),
    setItem: vi.fn(),
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('i18n start locale', () => {
  it('uses the saved locale when it is supported', async () => {
    stubStorage('es')
    expect((await loadI18n()).global.locale.value).toBe('es')
  })

  it('uses the saved locale for English too', async () => {
    stubStorage('en')
    expect((await loadI18n()).global.locale.value).toBe('en')
  })

  it('ignores an unsupported saved locale and falls back to the browser', async () => {
    stubStorage('fr')
    vi.stubGlobal('navigator', { language: 'es-ES' })
    expect((await loadI18n()).global.locale.value).toBe('es')
  })

  it('follows the browser language when nothing is saved', async () => {
    stubStorage(null)
    vi.stubGlobal('navigator', { language: 'es-ES' })
    expect((await loadI18n()).global.locale.value).toBe('es')
  })

  it('defaults to English for a non-Spanish browser', async () => {
    stubStorage(null)
    vi.stubGlobal('navigator', { language: 'en-GB' })
    expect((await loadI18n()).global.locale.value).toBe('en')
  })

  it('defaults to English when the browser reports no language', async () => {
    stubStorage(null)
    vi.stubGlobal('navigator', {})
    expect((await loadI18n()).global.locale.value).toBe('en')
  })

  it('defaults to English when localStorage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })
    expect((await loadI18n()).global.locale.value).toBe('en')
  })

  it('falls back to English for missing translations', async () => {
    stubStorage('es')
    expect((await loadI18n()).global.fallbackLocale.value).toBe('en')
  })
})
