import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TextareaInput from './TextareaInput.vue'

describe('TextareaInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    expect(w.find('.detail-field__label').text()).toBe('Comment')
  })

  it('shows the value', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    expect(w.find('.detail-field__val').text()).toBe('hello')
  })

  it('shows — for empty string', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '' } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('shows — for undefined modelValue', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: undefined } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('adds detail-field--wide by default (wide !== false)', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '' } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('does not add detail-field--wide when wide=false', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', wide: false } })
    expect(w.find('.detail-field').classes()).not.toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'x', rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('textarea').exists()).toBe(false)
  })

  it('enters edit mode on click', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('textarea').exists()).toBe(true)
  })

  it('adds detail-field--editing class when editing', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('.detail-field').classes()).toContain('detail-field--editing')
  })

  it('pre-fills draft with current modelValue', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('hello')
  })

  it('uses the rows prop', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', rows: 4 } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('textarea').attributes('rows')).toBe('4')
  })

  it('defaults to rows=2', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('textarea').attributes('rows')).toBe('2')
  })

  it('emits update:modelValue with trimmed value on blur', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    await w.find('textarea').setValue('  world  ')
    await w.find('textarea').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([['world']])
  })

  it('does not emit when value is unchanged', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    await w.find('textarea').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    await w.find('textarea').setValue('changed')
    await w.find('textarea').trigger('keydown', { key: 'Escape' })
    expect(w.find('textarea').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello' } })
    await w.find('.detail-field').trigger('click')
    await w.find('textarea').setValue('world')
    await w.find('textarea').trigger('blur')
    expect(w.find('textarea').exists()).toBe(false)
  })
})

describe('TextareaInput — form mode', () => {
  it('renders .form-group with label and textarea', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello', mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Comment')
    expect(w.find('textarea').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('textarea reflects modelValue', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello', mode: 'form' } })
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('hello')
  })

  it('textarea reflects undefined as empty string', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: undefined, mode: 'form' } })
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('uses the rows prop', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', mode: 'form', rows: 4 } })
    expect(w.find('textarea').attributes('rows')).toBe('4')
  })

  it('defaults to rows=2 in form mode', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', mode: 'form' } })
    expect(w.find('textarea').attributes('rows')).toBe('2')
  })

  it('passes placeholder attribute', () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: '', mode: 'form', placeholder: 'Add comment…' } })
    expect(w.find('textarea').attributes('placeholder')).toBe('Add comment…')
  })

  it('emits update:modelValue when textarea changes', async () => {
    const w = mount(TextareaInput, { props: { text: 'Comment', modelValue: 'hello', mode: 'form' } })
    await w.find('textarea').setValue('world')
    expect(w.emitted('update:modelValue')).toEqual([['world']])
  })
})
