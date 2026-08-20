import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CurrencyInput from '../../../src/shared/fields/CurrencyInput.vue'

describe('CurrencyInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    expect(w.find('.detail-field__label').text()).toBe('Amount')
  })

  it('always shows two decimals and the currency symbol', () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    expect(w.find('.currency-display__amount').text()).toBe('400.00')
    expect(w.find('.currency-display__symbol').text()).toBe('€')
  })

  it('honours a custom currency symbol', () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 1, currency: '$' } })
    expect(w.find('.currency-display__symbol').text()).toBe('$')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(CurrencyInput, { props: { text: 'A', modelValue: 0, wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(CurrencyInput, { props: { text: 'A', modelValue: 0, rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(CurrencyInput, { props: { text: 'A', modelValue: 0, rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(false)
  })

  it('enters edit mode on click and pre-fills the formatted amount', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('400.00')
  })

  it('emits a rounded number on blur', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('10.567')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([[10.57]])
  })

  it('emits on Enter keydown', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('25')
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([[25]])
  })

  it('accepts a comma as the decimal separator', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('12,50')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([[12.5]])
  })

  it('strips currency symbols and stray characters', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('€ 99.90 ')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([[99.9]])
  })

  it('clamps below-minimum input up to min', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('-50')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([[0]])
  })

  it('does not emit when the value is unchanged', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not emit for unparseable input', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('abc')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
    expect(w.find('input').exists()).toBe(false)
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('999')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.find('input').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(CurrencyInput, { props: { text: 'Amount', modelValue: 400 } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('50')
    await w.find('input').trigger('blur')
    expect(w.find('input').exists()).toBe(false)
  })
})

describe('CurrencyInput — form mode', () => {
  const formProps = { text: 'Amount', modelValue: 400, mode: 'form' as const }

  it('renders .form-group with a number input and a currency badge', () => {
    const w = mount(CurrencyInput, { props: formProps })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Amount')
    expect(w.find('input[type="number"]').exists()).toBe(true)
    expect(w.find('.currency-group__badge').text()).toBe('€')
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(CurrencyInput, { props: formProps })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('reflects modelValue and passes min, step and required', () => {
    const w = mount(CurrencyInput, { props: { ...formProps, min: 5, required: true } })
    const input = w.find('input')
    expect((input.element as HTMLInputElement).value).toBe('400')
    expect(input.attributes('min')).toBe('5')
    expect(input.attributes('step')).toBe('0.01')
    expect(input.attributes('required')).toBeDefined()
  })

  it('emits a rounded value on change', async () => {
    const w = mount(CurrencyInput, { props: formProps })
    await w.find('input').setValue('10.567')
    expect(w.emitted('update:modelValue')).toEqual([[10.57]])
  })

  it('clamps to min on change', async () => {
    const w = mount(CurrencyInput, { props: { ...formProps, min: 10 } })
    await w.find('input').setValue('3')
    expect(w.emitted('update:modelValue')).toEqual([[10]])
  })

  it('treats a cleared input as zero', async () => {
    const w = mount(CurrencyInput, { props: formProps })
    await w.find('input').setValue('')
    expect(w.emitted('update:modelValue')).toEqual([[0]])
  })
})
