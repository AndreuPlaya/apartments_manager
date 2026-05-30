import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TextInput from './TextInput.vue'

describe('TextInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    expect(w.find('.detail-field__label').text()).toBe('Name')
  })

  it('shows the value', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    expect(w.find('.detail-field__val').text()).toBe('Alice')
  })

  it('shows — for empty string', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: '' } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('shows — for undefined modelValue', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: undefined } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'v', wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('does not add detail-field--wide by default', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'v' } })
    expect(w.find('.detail-field').classes()).not.toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'v', rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'v', rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(false)
  })

  it('enters edit mode on click', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').exists()).toBe(true)
    expect(w.find('.detail-field__val').exists()).toBe(false)
  })

  it('adds detail-field--editing class when editing', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('.detail-field').classes()).toContain('detail-field--editing')
  })

  it('pre-fills draft with current modelValue', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('Alice')
  })

  it('uses the type prop on the input', async () => {
    const w = mount(TextInput, { props: { text: 'Email', modelValue: '', type: 'email' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').attributes('type')).toBe('email')
  })

  it('passes placeholder to the input', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: '', placeholder: 'Enter name' } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('input').attributes('placeholder')).toBe('Enter name')
  })

  it('emits update:modelValue with trimmed value on blur', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('  Bob  ')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([['Bob']])
  })

  it('emits update:modelValue on Enter', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Bob')
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['Bob']])
  })

  it('does not emit when value is unchanged', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Bob')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.find('input').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Bob')
    await w.find('input').trigger('blur')
    expect(w.find('input').exists()).toBe(false)
  })
})

describe('TextInput — form mode', () => {
  it('renders .form-group with label and input', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice', mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Name')
    expect(w.find('input').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice', mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('input reflects modelValue', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice', mode: 'form' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('Alice')
  })

  it('input reflects undefined modelValue as empty string', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: undefined, mode: 'form' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('emits update:modelValue when input changes', async () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: 'Alice', mode: 'form' } })
    await w.find('input').setValue('Bob')
    expect(w.emitted('update:modelValue')).toEqual([['Bob']])
  })

  it('passes required attribute', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: '', mode: 'form', required: true } })
    expect(w.find('input').attributes('required')).toBeDefined()
  })

  it('passes type attribute', () => {
    const w = mount(TextInput, { props: { text: 'Email', modelValue: '', mode: 'form', type: 'email' } })
    expect(w.find('input').attributes('type')).toBe('email')
  })

  it('passes autocomplete attribute', () => {
    const w = mount(TextInput, { props: { text: 'User', modelValue: '', mode: 'form', autocomplete: 'off' } })
    expect(w.find('input').attributes('autocomplete')).toBe('off')
  })

  it('passes minlength attribute', () => {
    const w = mount(TextInput, { props: { text: 'Pass', modelValue: '', mode: 'form', minlength: 8 } })
    expect(w.find('input').attributes('minlength')).toBe('8')
  })

  it('renders hint text when provided', () => {
    const w = mount(TextInput, { props: { text: 'Pass', modelValue: '', mode: 'form', hint: 'Min 8 chars' } })
    expect(w.find('.text-muted').text()).toBe('Min 8 chars')
  })

  it('does not render hint when not provided', () => {
    const w = mount(TextInput, { props: { text: 'Name', modelValue: '', mode: 'form' } })
    expect(w.find('.text-muted').exists()).toBe(false)
  })
})
