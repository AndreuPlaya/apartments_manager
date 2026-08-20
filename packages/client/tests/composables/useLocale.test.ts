import { mount } from '@vue/test-utils'
import { defineComponent, type ShallowUnwrapRef } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocale } from '../../src/composables/useLocale'

const LOCALE_KEY = 'apt-mgr:locale'

// happy-dom exposes `localStorage` as an empty object here, so the composable
// gets a minimal in-memory Storage to write against.
let store: Record<string, string>

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
  })
})

function setup(startLocale: 'en' | 'es') {
  const i18n = createI18n({
    legacy: false,
    locale: startLocale,
    fallbackLocale: 'en',
    messages: { en: {}, es: {} },
  })

  const Host = defineComponent({
    setup: () => useLocale(),
    template: '<div />',
  })

  const wrapper = mount(Host, { global: { plugins: [i18n] } })
  return { i18n, vm: wrapper.vm as unknown as ShallowUnwrapRef<ReturnType<typeof useLocale>> }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLocale', () => {
  it('exposes the active locale', () => {
    expect(setup('es').vm.currentLocale).toBe('es')
  })

  it('setLocale switches the active locale', () => {
    const { i18n, vm } = setup('en')
    vm.setLocale('es')
    expect(i18n.global.locale.value).toBe('es')
  })

  it('setLocale persists the choice', () => {
    const { vm } = setup('en')
    vm.setLocale('es')
    expect(store[LOCALE_KEY]).toBe('es')
  })

  it('toggleLocale goes from English to Spanish', () => {
    const { i18n, vm } = setup('en')
    vm.toggleLocale()
    expect(i18n.global.locale.value).toBe('es')
    expect(store[LOCALE_KEY]).toBe('es')
  })

  it('toggleLocale goes from Spanish back to English', () => {
    const { i18n, vm } = setup('es')
    vm.toggleLocale()
    expect(i18n.global.locale.value).toBe('en')
    expect(store[LOCALE_KEY]).toBe('en')
  })

  it('currentLocale tracks later changes', () => {
    const { vm } = setup('en')
    vm.setLocale('es')
    expect(vm.currentLocale).toBe('es')
  })
})
