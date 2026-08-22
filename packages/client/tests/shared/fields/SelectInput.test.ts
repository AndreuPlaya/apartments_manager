import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import SelectInput from '../../../src/shared/fields/SelectInput.vue'

// The dropdown is teleported to <body>, so it outlives the wrapper element and
// has to be queried from the document rather than through the wrapper.
enableAutoUnmount(afterEach)

const OPTIONS = [
  { value: 'a1', label: 'Listing 1' },
  { value: 'a2', label: 'Listing 2' },
]

const dropdown = () => document.querySelector('.select-dropdown')
const options = () => Array.from(document.querySelectorAll('.select-option'))
const backdrop = () => document.querySelector('.select-backdrop') as HTMLElement | null

function click(el: Element | null): Promise<void> {
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return Promise.resolve()
}

describe('SelectInput — inline mode (default)', () => {
  it('renders the label', () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    expect(w.find('.detail-field__label').text()).toBe('Listing')
  })

  it('shows the label of the matching option', () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    expect(w.find('.detail-field__val').text()).toBe('Listing 1')
  })

  it('shows — when modelValue has no matching option', () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: '', options: OPTIONS } })
    expect(w.find('.detail-field__val').text()).toBe('—')
  })

  it('falls back to the placeholder when empty', () => {
    const w = mount(SelectInput, {
      props: { text: 'Listing', modelValue: '', options: OPTIONS, placeholder: 'Select…' },
    })
    expect(w.find('.detail-field__val').text()).toBe('Select…')
  })

  it('adds detail-field--wide when wide=true', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: '', options: OPTIONS, wide: true } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--wide')
  })

  it('adds detail-field--readonly when rights=false', () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, rights: false } })
    expect(w.find('.detail-field').classes()).toContain('detail-field--readonly')
  })

  it('does not open the dropdown when rights=false', async () => {
    const w = mount(SelectInput, { props: { text: 'A', modelValue: 'a1', options: OPTIONS, rights: false } })
    await w.find('.inline-select-trigger').trigger('click')
    expect(dropdown()).toBeNull()
  })

  it('opens the dropdown on trigger click', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    expect(dropdown()).not.toBeNull()
    expect(w.find('.detail-field').classes()).toContain('select-field--open')
  })

  it('renders every option when open', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    expect(options().map((o) => o.textContent)).toEqual(['Listing 1', 'Listing 2'])
  })

  it('marks the selected option as active', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a2', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    expect(options()[1]!.classList.contains('select-option--active')).toBe(true)
    expect(options()[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('emits update:modelValue and closes when an option is picked', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    await click(options()[1]!)
    expect(w.emitted('update:modelValue')).toEqual([['a2']])
    expect(dropdown()).toBeNull()
  })

  it('closes without emitting when the current value is picked', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    await click(options()[0]!)
    expect(w.emitted('update:modelValue')).toBeFalsy()
    expect(dropdown()).toBeNull()
  })

  it('closes on backdrop click without emitting', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    await click(backdrop())
    expect(dropdown()).toBeNull()
    expect(w.emitted('update:modelValue')).toBeFalsy()
  })

  it('closes on scroll so the dropdown cannot detach from its trigger', async () => {
    const w = mount(SelectInput, { props: { text: 'Listing', modelValue: 'a1', options: OPTIONS } })
    await w.find('.inline-select-trigger').trigger('click')
    expect(dropdown()).not.toBeNull()

    window.dispatchEvent(new Event('scroll'))
    await w.vm.$nextTick()

    expect(dropdown()).toBeNull()
  })

  it('does not render the validity mirror in inline mode', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, required: true },
    })
    expect(w.find('.custom-select-validity').exists()).toBe(false)
  })

  it('does not render a placeholder option in inline mode', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, placeholder: 'Select…' },
    })
    await w.find('.inline-select-trigger').trigger('click')
    expect(document.querySelector('.select-option--placeholder')).toBeNull()
  })
})

describe('SelectInput — form mode', () => {
  it('renders .form-group with a label and a combobox trigger', () => {
    const w = mount(SelectInput, {
      props: { text: 'Listing', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('label').text()).toBe('Listing')

    const trigger = w.find('.custom-select-trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('does not render .detail-field in form mode', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    expect(w.find('.detail-field').exists()).toBe(false)
  })

  it('marks the trigger as a placeholder while empty', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', placeholder: 'Select…' },
    })
    expect(w.find('.custom-select-trigger').classes()).toContain('custom-select-trigger--placeholder')
  })

  it('opens on click and reflects aria-expanded', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    expect(dropdown()).not.toBeNull()
    expect(w.find('.custom-select-trigger').attributes('aria-expanded')).toBe('true')
  })

  it('opens on Enter and on Space', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('keydown.enter')
    expect(dropdown()).not.toBeNull()

    await w.find('.custom-select-trigger').trigger('keydown.escape')
    expect(dropdown()).toBeNull()

    await w.find('.custom-select-trigger').trigger('keydown.space')
    expect(dropdown()).not.toBeNull()
  })

  it('closes on Escape', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    await w.find('.custom-select-trigger').trigger('keydown.escape')
    expect(dropdown()).toBeNull()
  })

  it('renders all options', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    expect(options()).toHaveLength(2)
  })

  it('renders the placeholder option when provided', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', placeholder: 'Select…' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    expect(options()).toHaveLength(3)
    expect(options()[0]!.textContent).toBe('Select…')
    expect(options()[0]!.classList.contains('select-option--placeholder')).toBe(true)
  })

  it('emits an empty value when the placeholder option is picked', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form', placeholder: 'Select…' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    await click(options()[0]!)
    expect(w.emitted('update:modelValue')).toEqual([['']])
  })

  it('does not render the placeholder option when not provided', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    expect(options()).toHaveLength(2)
  })

  it('enforces required through a mirror input the browser can validate', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', required: true },
    })
    const mirror = w.find('.custom-select-validity')
    expect(mirror.exists()).toBe(true)
    expect(mirror.attributes('required')).toBeDefined()
    expect((mirror.element as HTMLInputElement).value).toBe('')
  })

  it('leaves the mirror optional when required is not set', () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    const mirror = w.find('.custom-select-validity')
    expect(mirror.attributes('required')).toBeUndefined()
    expect((mirror.element as HTMLInputElement).value).toBe('a1')
  })

  it('hands focus to the visible trigger when the browser focuses the mirror', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: '', options: OPTIONS, mode: 'form', required: true },
      attachTo: document.body,
    })
    await w.find('.custom-select-validity').trigger('focus')
    expect(document.activeElement).toBe(w.find('.custom-select-trigger').element)
  })

  it('emits update:modelValue when the selection changes', async () => {
    const w = mount(SelectInput, {
      props: { text: 'A', modelValue: 'a1', options: OPTIONS, mode: 'form' },
    })
    await w.find('.custom-select-trigger').trigger('click')
    await click(options()[1]!)
    expect(w.emitted('update:modelValue')).toEqual([['a2']])
  })
})
