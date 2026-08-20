import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProfilePasswordField from '../../../src/shared/fields/ProfilePasswordField.vue'

describe('ProfilePasswordField — display', () => {
  it('renders the label', () => {
    const w = mount(ProfilePasswordField, { props: { text: 'Password', modelValue: 'secret' } })
    expect(w.find('.detail-field__label').text()).toBe('Password')
  })

  it('masks an existing password rather than showing it', () => {
    const w = mount(ProfilePasswordField, { props: { text: 'Password', modelValue: 'secret' } })
    const shown = w.find('.detail-field__val').text()

    expect(shown).toBe('••••••••')
    expect(shown).not.toContain('secret')
  })

  it('shows an em dash when no password is set', () => {
    const w = mount(ProfilePasswordField, { props: { text: 'Password', modelValue: '' } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })
})

describe('ProfilePasswordField — editing', () => {
  it('enters edit mode on click with an empty draft', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'Password', modelValue: 'secret' } })
    await w.find('.detail-field').trigger('click')

    expect(w.find('input').exists()).toBe(true)
    // The existing password is never loaded into the editor.
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('starts masked', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'Password', modelValue: '' } })
    await w.find('.detail-field').trigger('click')

    expect(w.find('input').attributes('type')).toBe('password')
  })

  it('forwards autocomplete and minlength', async () => {
    const w = mount(ProfilePasswordField, {
      props: { text: 'P', modelValue: '', autocomplete: 'new-password', minlength: 8 },
    })
    await w.find('.detail-field').trigger('click')

    expect(w.find('input').attributes('autocomplete')).toBe('new-password')
    expect(w.find('input').attributes('minlength')).toBe('8')
  })
})

describe('ProfilePasswordField — reveal toggle', () => {
  it('switches the input between password and text', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')

    await w.find('.pf-pw-eye').trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')

    await w.find('.pf-pw-eye').trigger('click')
    expect(w.find('input').attributes('type')).toBe('password')
  })

  it('relabels itself for assistive tech', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')

    expect(w.find('.pf-pw-eye').attributes('aria-label')).toBe('Show')
    await w.find('.pf-pw-eye').trigger('click')
    expect(w.find('.pf-pw-eye').attributes('aria-label')).toBe('Hide')
  })

  it('suppresses mousedown so revealing does not blur and close the editor', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    w.find('.pf-pw-eye').element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(w.find('input').exists()).toBe(true)
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('ProfilePasswordField — committing', () => {
  it('emits the new password on blur', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')
    await w.find('input').trigger('blur')

    expect(w.emitted('update:modelValue')).toEqual([['newsecret']])
    expect(w.find('input').exists()).toBe(false)
  })

  it('emits on Enter', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')
    await w.find('input').trigger('keydown', { key: 'Enter' })

    expect(w.emitted('update:modelValue')).toEqual([['newsecret']])
  })

  it('does not emit when the draft is left empty', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: 'secret' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').trigger('blur')

    expect(w.emitted('update:modelValue')).toBeFalsy()
    expect(w.find('input').exists()).toBe(false)
  })

  it('cancels on Escape without emitting', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')
    await w.find('input').trigger('keydown', { key: 'Escape' })

    expect(w.emitted('update:modelValue')).toBeFalsy()
    expect(w.find('input').exists()).toBe(false)
  })

  it('does not keep the typed password after committing', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')
    await w.find('input').trigger('blur')

    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('does not keep the typed password after cancelling', async () => {
    const w = mount(ProfilePasswordField, { props: { text: 'P', modelValue: '' } })
    await w.find('.detail-field').trigger('click')
    await w.find('input').setValue('newsecret')
    await w.find('input').trigger('keydown', { key: 'Escape' })

    await w.find('.detail-field').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })
})
