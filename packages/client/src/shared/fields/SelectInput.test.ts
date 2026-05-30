import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SelectInput from './SelectInput.vue'

const OPTIONS = [
  { value: 'a1', label: 'Apartment 1' },
  { value: 'a2', label: 'Apartment 2' },
]

describe('SelectInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    expect(w.find('.detail-field__label').text()).toBe('Apartment')
  })

  it('shows the label of the matching option', () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    expect(w.find('.detail-field__val').text()).toBe('Apartment 1')
  })

  it('shows — when modelValue has no matching option', () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: '', options: OPTIONS } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: '', options: OPTIONS, wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not start editing when rights=false', async () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, rights: false } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('select').exists()).toBe(false)
  })

  it('enters edit mode on click', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('select').exists()).toBe(true)
  })

  it('renders all options when editing', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    const opts = w.findAll('option')
    expect(opts).toHaveLength(2)
    expect(opts[0].text()).toBe('Apartment 1')
    expect(opts[1].text()).toBe('Apartment 2')
  })

  it('emits update:modelValue on change', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    await w.find('select').setValue('a2')
    expect(w.emitted('update:modelValue')).toEqual([['a2']])
  })

  it('exits editing mode on blur', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    expect(w.find('select').exists()).toBe(true)
    await w.find('select').trigger('blur')
    expect(w.find('select').exists()).toBe(false)
  })

  it('does not emit when value is unchanged on blur', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    await w.find('select').trigger('blur')
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('cancels edit on Escape without emitting', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    await w.find('select').trigger('keydown', { key: 'Escape' })
    expect(w.find('select').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('exits editing after commit', async () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS } })
    await w.find('.detail-field').trigger('click')
    await w.find('select').setValue('a2')
    expect(w.find('select').exists()).toBe(false)
  })
})

describe('SelectInput — form mode', () => {
  it('renders .form-group with label and select', () => {
    const w = mount(SelectInput, { props: { text: 'Apartment', modelValue: 'a1', options: OPTIONS, mode: 'form' } })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Apartment')
    expect(w.find('select').exists()).toBe(true)
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' } })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('renders all options', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' } })
    expect(w.findAll('option')).toHaveLength(2)
  })

  it('renders placeholder option when provided', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', placeholder: 'Select…' },
    })
    const opts = w.findAll('option')
    expect(opts).toHaveLength(3)
    expect(opts[0].text()).toBe('Select…')
    expect(opts[0].attributes('value')).toBe('')
  })

  it('does not render placeholder option when not provided', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' } })
    expect(w.findAll('option')).toHaveLength(2)
  })

  it('passes required attribute', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', required: true } })
    expect(w.find('select').attributes('required')).toBeDefined()
  })

  it('emits update:modelValue when selection changes', async () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' } })
    await w.find('select').setValue('a2')
    expect(w.emitted('update:modelValue')).toEqual([['a2']])
  })
})
