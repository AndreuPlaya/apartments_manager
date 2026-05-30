import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CheckboxInput from '../../../src/shared/fields/CheckboxInput.vue'

describe('CheckboxInput — inline single-line (no checkboxLabel)', () => {
  it('renders detail-field--checkbox layout', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true } })
    expect(w.find('.detail-field.detail-field--checkbox').exists()).toBe(true)
  })

  it('shows the text label', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true } })
    expect(w.find('.detail-field__label').text()).toBe('Active')
  })

  it('checkbox is checked when modelValue=true', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true } })
    expect((w.find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('checkbox is unchecked when modelValue=false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false } })
    expect((w.find('input').element as HTMLInputElement).checked).toBe(false)
  })

  it('checkbox is disabled when rights=false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true, rights: false } })
    expect((w.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('checkbox is enabled when rights is not false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true, rights: true } })
    expect((w.find('input').element as HTMLInputElement).disabled).toBe(false)
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true, rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('emits update:modelValue with true on check', async () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false } })
    await w.find('input').setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits update:modelValue with false on uncheck', async () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true } })
    await w.find('input').setValue(false)
    expect(w.emitted('update:modelValue')).toEqual([[false]])
  })
})

describe('CheckboxInput — inline two-line (with checkboxLabel)', () => {
  it('renders detail-field without detail-field--checkbox', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Requested' } })
    expect(w.find('.detail-field').exists()).toBe(true)
    expect(w.find('.detail-field').classes()).not.toContain('detail-field--checkbox')
  })

  it('shows text as the header label', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Requested' } })
    expect(w.find('.detail-field__label').text()).toBe('Crib')
  })

  it('shows checkboxLabel next to the checkbox', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Requested' } })
    expect(w.find('.detail-field__checkbox').text()).toContain('Requested')
  })

  it('checkbox is checked when modelValue=true', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: true, checkboxLabel: 'Requested' } })
    expect((w.find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('checkbox is disabled when rights=false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Req', rights: false } })
    expect((w.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Req', rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('emits update:modelValue on change', async () => {
    const w = mount(CheckboxInput, { props: { text: 'Crib', modelValue: false, checkboxLabel: 'Requested' } })
    await w.find('input').setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })
})

describe('CheckboxInput — form mode', () => {
  it('renders .form-group with .form-checkbox label', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false, mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label.form-checkbox').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false, mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('shows the text inside the checkbox label', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false, mode: 'form' } })
    expect(w.find('label').text()).toContain('Active')
  })

  it('checkbox is checked when modelValue=true', () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true, mode: 'form' } })
    expect((w.find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:modelValue with true on check', async () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: false, mode: 'form' } })
    await w.find('input').setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits update:modelValue with false on uncheck', async () => {
    const w = mount(CheckboxInput, { props: { text: 'Active', modelValue: true, mode: 'form' } })
    await w.find('input').setValue(false)
    expect(w.emitted('update:modelValue')).toEqual([[false]])
  })
})
