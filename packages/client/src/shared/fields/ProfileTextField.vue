<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  text: string
  modelValue: string | undefined
  type?: string
  placeholder?: string
  wide?: boolean
  required?: boolean
  minlength?: number
  autocomplete?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  draft.value = props.modelValue ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function cancel() {
  editing.value = false
}

function commit() {
  editing.value = false
  emit('update:modelValue', draft.value)
}
</script>

<template>
  <div
    :class="['detail-field', editing && 'detail-field--editing', wide && 'detail-field--wide']"
    @click="!editing && startEdit()"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val">{{ modelValue || '—' }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="draft"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :required="required"
      :minlength="minlength"
      :autocomplete="autocomplete"
      @blur="commit"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    />
  </div>
</template>
