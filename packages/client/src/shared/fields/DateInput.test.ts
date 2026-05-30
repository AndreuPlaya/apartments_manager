import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DateInput from './DateInput.vue'

describe('DateInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    expect(w.find('.detail-field__label').text()).toBe('Check-in')
  })

  it('shows formatted date', () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    // The formatted text should contain the year at minimum
    expect(w.find('.detail-field__val').text()).toContain('2024')
  })

  it('shows — for empty modelValue', () => {
    const w = mount(DateInput, { props: { text: 'Paid date', modelValue: '' } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(DateInput, { props: { text: 'D', modelValue: '', wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(DateInput, { props: { text: 'D', modelValue: '', rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(DateInput, { props: { text: 'D', modelValue: '2024-01-01', rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(false)
  })

  it('enters edit mode on click', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input[type="date"]').exists()).toBe(true)
  })

  it('pre-fills draft with current date value', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('2024-06-01')
  })

  it('emits update:modelValue on blur with new date', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('2024-07-15')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([['2024-07-15']])
  })

  it('emits on Enter keydown', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('2024-08-01')
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['2024-08-01']])
  })

  it('does not emit when date is unchanged', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('2024-12-31')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.find('input').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('2024-07-01')
    await w.find('input').trigger('blur')
    expect(w.find('input').exists()).toBe(false)
  })
})

describe('DateInput — form mode', () => {
  it('renders .form-group with label and date input', () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01', mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Check-in')
    expect(w.find('input[type="date"]').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '', mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('input reflects modelValue', () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01', mode: 'form' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('2024-06-01')
  })

  it('passes required attribute', () => {
    const w = mount(DateInput, { props: { text: 'D', modelValue: '', mode: 'form', required: true } })
    expect(w.find('input').attributes('required')).toBeDefined()
  })

  it('emits update:modelValue when date changes', async () => {
    const w = mount(DateInput, { props: { text: 'Check-in', modelValue: '2024-06-01', mode: 'form' } })
    await w.find('input').setValue('2024-09-01')
    expect(w.emitted('update:modelValue')).toEqual([['2024-09-01']])
  })
})
