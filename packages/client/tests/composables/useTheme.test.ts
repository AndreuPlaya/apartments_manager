import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const THEME_KEY = 'apt-mgr:theme'

// El módulo lee el tema guardado al cargarse, así que cada caso reinicia el
// registro de módulos para partir de un estado limpio.
let store: Record<string, string>

function stubStorage(getItem: (k: string) => string | null) {
  vi.stubGlobal('localStorage', {
    getItem,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
  })
}

beforeEach(() => {
  store = {}
  stubStorage((k: string) => store[k] ?? null)
  document.documentElement.removeAttribute('data-theme')
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function load() {
  return import('../../src/composables/useTheme')
}

describe('useTheme', () => {
  it('defaults to the light theme of the chromatic identity', async () => {
    const { useTheme } = await load()
    const { currentTheme, isDark } = useTheme()
    expect(currentTheme.value).toBe('light')
    expect(isDark.value).toBe(false)
  })

  it('restores dark mode when it was stored', async () => {
    store[THEME_KEY] = 'dark'
    const { useTheme } = await load()
    expect(useTheme().isDark.value).toBe(true)
  })

  it('falls back to light for an unknown stored value', async () => {
    store[THEME_KEY] = 'sepia'
    const { useTheme } = await load()
    expect(useTheme().currentTheme.value).toBe('light')
  })

  it('falls back to light when storage is unavailable', async () => {
    stubStorage(() => {
      throw new Error('no storage')
    })
    const { useTheme } = await load()
    expect(useTheme().currentTheme.value).toBe('light')
  })

  it('setDark(true) applies and persists dark mode', async () => {
    const { useTheme } = await load()
    const { setDark, isDark } = useTheme()
    setDark(true)
    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(store[THEME_KEY]).toBe('dark')
  })

  it('setDark(false) goes back to the light theme', async () => {
    store[THEME_KEY] = 'dark'
    const { useTheme } = await load()
    const { setDark, currentTheme } = useTheme()
    setDark(false)
    expect(currentTheme.value).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(store[THEME_KEY]).toBe('light')
  })

  it('toggleTheme flips between both themes', async () => {
    const { useTheme } = await load()
    const { toggleTheme, currentTheme } = useTheme()
    toggleTheme()
    expect(currentTheme.value).toBe('dark')
    toggleTheme()
    expect(currentTheme.value).toBe('light')
  })

  it('applyTheme stamps the attribute the stylesheet keys off', async () => {
    const { applyTheme } = await load()
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
