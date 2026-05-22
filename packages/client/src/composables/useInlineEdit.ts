import { ref, nextTick, type Ref } from 'vue'

export function useInlineEdit<TField extends string = string>(
  inputRef: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>
) {
  const editingField = ref<TField | null>(null)
  const editingValue = ref('')

  async function startEdit(field: TField, currentValue: unknown, e?: Event) {
    e?.stopPropagation()
    editingField.value = field
    editingValue.value = String(currentValue ?? '')
    await nextTick()
    inputRef.value?.focus()
    ;(inputRef.value as HTMLInputElement)?.select?.()
  }

  function cancelEdit() {
    editingField.value = null
  }

  return { editingField, editingValue, startEdit, cancelEdit }
}
