<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: string | undefined
  rights?: boolean
  wide?: boolean
  rows?: number
  placeholder?: string
  mode?: 'inline' | 'form'
}>(), { rights: true, wide: true })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue ?? '',
  set: (val: string) => emit('update:modelValue', val),
})

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)

function startEdit() {
  if (props.rights === false) return
  draft.value = props.modelValue ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function cancel() {
  editing.value = false
}

function commit() {
  editing.value = false
  const val = draft.value.trim()
  if (val === (props.modelValue ?? '').trim()) return
  emit('update:modelValue', val)
}
</script>

<template>
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <textarea
      v-model="model"
      :rows="rows ?? 2"
      :placeholder="placeholder"
    />
  </div>

  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val detail-field__val--pre">{{ modelValue || '—' }}</span>
    <textarea
      v-else
      ref="inputRef"
      v-model="draft"
      :rows="rows ?? 2"
      :placeholder="placeholder"
      @blur="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    />
  </div>
</template>
