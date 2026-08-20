import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProfileTextField from '../../../src/shared/fields/ProfileTextField.vue'

describe('ProfileTextField — display', () => {
  it('renders the label', () => {
    const w = mount(ProfileTextField, { props: { text: 'Full name', modelValue: 'Alice' } })
    expect(w.find('.detail-field__label').text()).toBe('Full name')
  })

  it('shows the value', () => {
    const w = mount(ProfileTextField, { props: { text: 'Full name', modelValue: 'Alice' } })
    expect(w.find('.detail-field__val').text()).toBe('Alice')
  })

  it('shows an em dash when the value is empty', () => {
    const w = mount(ProfileTextField, { props: { text: 'Email', modelValue: '' } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('shows an em dash when the value is undefined', () => {
    const w = mount(ProfileTextField, { props: { text: 'Email', modelValue: undefined } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'x', wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })
})

describe('ProfileTextField — editing', () => {
  it('enters edit mode on click and marks the field as editing', async () => {
    const w = mount(ProfileTextField, { props: { text: 'Full name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')

    expect(w.find('input').exists()).toBe(true)
    expect(w.find('.detail-field').classes()).toContain('detail-field--editing')
  })

  it('pre-fills the draft with the current value', async () => {
    const w = mount(ProfileTextField, { props: { text: 'Full name', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')

    expect((w.find('input').element as HTMLInputElement).value).toBe('Alice')
  })

  it('starts from an empty draft when there is no value', async () => {
    const w = mount(ProfileTextField, { props: { text: 'Email', modelValue: undefined } })
    await w.find('.detail-field').trigger('click')

    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('defaults to a text input and forwards the type prop', async () => {
    const plain = mount(ProfileTextField, { props: { text: 'A', modelValue: '' } })
    await plain.find('.detail-field').trigger('click')
    expect(plain.find('input').attributes('type')).toBe('text')

    const email = mount(ProfileTextField, { props: { text: 'A', modelValue: '', type: 'email' } })
    await email.find('.detail-field').trigger('click')
    expect(email.find('input').attributes('type')).toBe('email')
  })

  it('forwards placeholder, required, minlength and autocomplete', async () => {
    const w = mount(ProfileTextField, {
      props: {
        text: 'A',
        modelValue: '',
        placeholder: 'Type here',
        required: true,
        minlength: 3,
        autocomplete: 'email',
      },
    })
    await w.find('.detail-field').trigger('click')

    const input = w.find('input')
    expect(input.attributes('placeholder')).toBe('Type here')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('minlength')).toBe('3')
    expect(input.attributes('autocomplete')).toBe('email')
  })

  it('does not restart editing when the field is clicked again', async () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Alicia')
    await w.find('.detail-field').trigger('click')

    expect((w.find('input').element as HTMLInputElement).value).toBe('Alicia')
  })
})

describe('ProfileTextField — committing', () => {
  it('emits the draft on blur and leaves edit mode', async () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Alicia')
    await w.find('input').trigger('blur')

    expect(w.emitted('update:modelValue')).toEqual([['Alicia']])
    expect(w.find('input').exists()).toBe(false)
  })

  it('emits on Enter', async () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Alicia')
    await w.find('input').trigger('keydown', { key: 'Enter' })

    expect(w.emitted('update:modelValue')).toEqual([['Alicia']])
  })

  it('emits an empty string when the field is cleared', async () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('')
    await w.find('input').trigger('blur')

    expect(w.emitted('update:modelValue')).toEqual([['']])
  })

  it('cancels on Escape without emitting', async () => {
    const w = mount(ProfileTextField, { props: { text: 'A', modelValue: 'Alice' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('Alicia')
    await w.find('input').trigger('keydown', { key: 'Escape' })

    expect(w.emitted('update:modelValue')).toBeFalsy()
    expect(w.find('input').exists()).toBe(false)
  })
})
