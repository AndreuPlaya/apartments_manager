import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useInlineEdit } from './useInlineEdit'

describe('useInlineEdit', () => {
  it('initialises editingField as null and editingValue as empty string', () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingField, editingValue } = useInlineEdit(inputRef)
    expect(editingField.value).toBeNull()
    expect(editingValue.value).toBe('')
  })

  it('startEdit sets editingField and editingValue from a string', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingField, editingValue, startEdit } = useInlineEdit(inputRef)
    await startEdit('name', 'Alice')
    expect(editingField.value).toBe('name')
    expect(editingValue.value).toBe('Alice')
  })

  it('startEdit converts non-string currentValue to string', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingValue, startEdit } = useInlineEdit(inputRef)
    await startEdit('price', 99)
    expect(editingValue.value).toBe('99')
  })

  it('startEdit converts null currentValue to empty string', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingValue, startEdit } = useInlineEdit(inputRef)
    await startEdit('comment', null)
    expect(editingValue.value).toBe('')
  })

  it('startEdit converts undefined currentValue to empty string', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingValue, startEdit } = useInlineEdit(inputRef)
    await startEdit('comment', undefined)
    expect(editingValue.value).toBe('')
  })

  it('startEdit calls stopPropagation on the provided event', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { startEdit } = useInlineEdit(inputRef)
    const event = { stopPropagation: vi.fn() } as unknown as Event
    await startEdit('name', 'Alice', event)
    expect(event.stopPropagation).toHaveBeenCalledOnce()
  })

  it('startEdit does not throw when no event is provided', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { startEdit } = useInlineEdit(inputRef)
    await expect(startEdit('name', 'Alice')).resolves.toBeUndefined()
  })

  it('startEdit focuses and selects the input element after nextTick', async () => {
    const mockInput = { focus: vi.fn(), select: vi.fn() } as unknown as HTMLInputElement
    const inputRef = ref<HTMLInputElement | null>(mockInput)
    const { startEdit } = useInlineEdit(inputRef)
    await startEdit('name', 'Alice')
    expect(mockInput.focus).toHaveBeenCalledOnce()
    expect(mockInput.select).toHaveBeenCalledOnce()
  })

  it('startEdit handles an inputRef element without a select method', async () => {
    const mockInput = { focus: vi.fn() } as unknown as HTMLInputElement
    const inputRef = ref<HTMLInputElement | null>(mockInput)
    const { startEdit } = useInlineEdit(inputRef)
    await expect(startEdit('name', 'Alice')).resolves.toBeUndefined()
    expect(mockInput.focus).toHaveBeenCalledOnce()
  })

  it('startEdit does not throw when inputRef is null', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { startEdit } = useInlineEdit(inputRef)
    await expect(startEdit('name', 'Alice')).resolves.toBeUndefined()
  })

  it('cancelEdit resets editingField to null', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingField, startEdit, cancelEdit } = useInlineEdit(inputRef)
    await startEdit('name', 'Alice')
    expect(editingField.value).toBe('name')
    cancelEdit()
    expect(editingField.value).toBeNull()
  })

  it('cancelEdit does not affect editingValue', async () => {
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingValue, startEdit, cancelEdit } = useInlineEdit(inputRef)
    await startEdit('name', 'Alice')
    cancelEdit()
    expect(editingValue.value).toBe('Alice')
  })

  it('supports typed TField generics', async () => {
    type Field = 'name' | 'email'
    const inputRef = ref<HTMLInputElement | null>(null)
    const { editingField, startEdit } = useInlineEdit<Field>(inputRef)
    await startEdit('email', 'alice@example.com')
    expect(editingField.value).toBe('email')
  })
})
