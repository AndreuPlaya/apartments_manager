import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import NumberInput from './NumberInput.vue'

describe('NumberInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    expect(w.find('.detail-field__label').text()).toBe('Adults')
  })

  it('shows the numeric value', () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    expect(w.find('.detail-field__val').text()).toBe('2')
  })

  it('uses displayFn when provided', () => {
    const w = mount(NumberInput, {
      props: { text: 'Amount', modelValue: 9.5, displayFn: (v: number) => `€${v.toFixed(2)}` },
    })
    expect(w.find('.detail-field__val').text()).toBe('€9.50')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 1, wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 1, rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 1, rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(false)
  })

  it('enters edit mode on click', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(true)
  })

  it('pre-fills draft with current value', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 3 } })
    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('3')
  })

  it('passes min/max/step to the input', async () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 1, min: 0, max: 100, step: 0.5 } })
    await w.find('.detail-field').trigger('click')
    const input = w.find('input')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('100')
    expect(input.attributes('step')).toBe('0.5')
  })

  it('emits update:modelValue as a number on blur', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('5')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([[5]])
  })

  it('emits on Enter keydown', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('4')
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([[4]])
  })

  it('does not emit when value is unchanged', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('9')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.find('input').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('5')
    await w.find('input').trigger('blur')
    expect(w.find('input').exists()).toBe(false)
  })
})

describe('NumberInput — form mode', () => {
  it('renders .form-group with label and number input', () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2, mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Adults')
    expect(w.find('input[type="number"]').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 2, mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('input reflects modelValue', () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 3, mode: 'form' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('3')
  })

  it('passes min/max/step to input', () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 1, mode: 'form', min: 0, max: 10, step: 0.1 } })
    expect(w.find('input').attributes('min')).toBe('0')
    expect(w.find('input').attributes('max')).toBe('10')
    expect(w.find('input').attributes('step')).toBe('0.1')
  })

  it('passes required attribute', () => {
    const w = mount(NumberInput, { props: { text: 'N', modelValue: 0, mode: 'form', required: true } })
    expect(w.find('input').attributes('required')).toBeDefined()
  })

  it('emits update:modelValue as a number on change', async () => {
    const w = mount(NumberInput, { props: { text: 'Adults', modelValue: 1, mode: 'form' } })
    await w.find('input').setValue('4')
    expect(w.emitted('update:modelValue')).toEqual([[4]])
  })
})
