import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppSwitch from '../../src/shared/AppSwitch.vue'

describe('AppSwitch', () => {
  it('exposes itself as a switch to assistive tech', () => {
    const w = mount(AppSwitch, { props: { modelValue: false, label: 'Dark mode' } })
    const btn = w.get('button')
    expect(btn.attributes('role')).toBe('switch')
    expect(btn.attributes('aria-checked')).toBe('false')
    expect(btn.attributes('aria-label')).toBe('Dark mode')
  })

  it('marks the on state in the class and in aria-checked', () => {
    const w = mount(AppSwitch, { props: { modelValue: true } })
    expect(w.get('button').attributes('aria-checked')).toBe('true')
    expect(w.get('button').classes()).toContain('app-switch--on')
  })

  it('emits the inverted value on click', async () => {
    const w = mount(AppSwitch, { props: { modelValue: false } })
    await w.get('button').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits false when it was already on', async () => {
    const w = mount(AppSwitch, { props: { modelValue: true } })
    await w.get('button').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays put while disabled', async () => {
    const w = mount(AppSwitch, { props: { modelValue: false, disabled: true } })
    await w.get('button').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
