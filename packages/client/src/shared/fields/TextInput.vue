<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: string | undefined
  rights?: boolean
  wide?: boolean
  placeholder?: string
  type?: string
  mode?: 'inline' | 'form'
  required?: boolean
  minlength?: number
  autocomplete?: string
  hint?: string
}>(), { rights: true })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue ?? '',
  set: (val: string) => emit('update:modelValue', val),
})

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

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
    <input
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :required="required"
      :minlength="minlength"
      :autocomplete="autocomplete"
    />
    <span v-if="hint" class="text-muted text-sm">{{ hint }}</span>
  </div>

  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val">{{ modelValue || '—' }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="draft"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      @blur="commit"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    />
  </div>
</template>
