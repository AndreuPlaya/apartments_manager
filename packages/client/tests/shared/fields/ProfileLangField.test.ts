import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ProfileLangField from '../../../src/shared/fields/ProfileLangField.vue'

// The dropdown is teleported to <body>.
enableAutoUnmount(afterEach)

const dropdown = () => document.querySelector('.select-dropdown')
const options = () => Array.from(document.querySelectorAll('.select-option'))
const backdrop = () => document.querySelector('.select-backdrop')

function click(el: Element | null): Promise<void> {
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return Promise.resolve()
}

describe('ProfileLangField — display', () => {
  it('renders the label', () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    expect(w.find('.detail-field__label').text()).toBe('Language')
  })

  it('shows the selected locale in its own language', () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'es' } })

    expect(w.find('.detail-field__val').text()).toBe('Español')
    expect(w.find('.pf-lang-flag').text()).toBe('🇪🇸')
  })

  it('falls back to English for an unknown locale', () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'fr' } })
    expect(w.find('.detail-field__val').text()).toBe('English')
  })
})

describe('ProfileLangField — dropdown', () => {
  it('opens on click and flags the field as open', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')

    expect(dropdown()).not.toBeNull()
    expect(w.find('.detail-field').classes()).toContain('select-field--open')
  })

  it('lists both supported locales', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')

    expect(options()).toHaveLength(2)
    expect(options().map((o) => o.textContent!.trim())).toEqual([
      '🇬🇧 English',
      '🇪🇸 Español',
    ])
  })

  it('marks the active locale for assistive tech', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'es' } })
    await w.find('.detail-field').trigger('click')

    expect(options()[1]!.getAttribute('aria-selected')).toBe('true')
    expect(options()[1]!.classList.contains('select-option--active')).toBe(true)
    expect(options()[0]!.getAttribute('aria-selected')).toBe('false')
  })

  it('emits the picked locale and closes', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')
    await click(options()[1]!)

    expect(w.emitted('update:modelValue')).toEqual([['es']])
    expect(dropdown()).toBeNull()
  })

  it('still emits when the current locale is picked again', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')
    await click(options()[0]!)

    expect(w.emitted('update:modelValue')).toEqual([['en']])
    expect(dropdown()).toBeNull()
  })

  it('closes on backdrop click without emitting', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')
    await click(backdrop())

    expect(dropdown()).toBeNull()
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('closes on scroll so the dropdown cannot detach from its trigger', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')
    expect(dropdown()).not.toBeNull()

    window.dispatchEvent(new Event('scroll'))
    await w.vm.$nextTick()

    expect(dropdown()).toBeNull()
  })

  it('stops listening for scroll once unmounted', async () => {
    const w = mount(ProfileLangField, { props: { text: 'Language', modelValue: 'en' } })
    await w.find('.detail-field').trigger('click')
    w.unmount()

    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow()
    expect(dropdown()).toBeNull()
  })
})
