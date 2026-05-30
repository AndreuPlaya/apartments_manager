<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: number
  rights?: boolean
  wide?: boolean
  min?: number
  max?: number
  step?: number
  displayFn?: (v: number) => string
  mode?: 'inline' | 'form'
  required?: boolean
}>(), { rights: true })

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  if (props.rights === false) return
  draft.value = String(props.modelValue)
  editing.value = true
  nextTick(() => { inputRef.value?.focus(); inputRef.value?.select() })
}

function cancel() {
  editing.value = false
}

function commit() {
  editing.value = false
  const val = Number(draft.value)
  if (val === props.modelValue) return
  emit('update:modelValue', val)
}

function displayValue() {
  return props.displayFn ? props.displayFn(props.modelValue) : String(props.modelValue)
}
</script>

<template>
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <input
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :required="required"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).valueAsNumber)"
    />
  </div>

  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val">{{ displayValue() }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="draft"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      @blur="commit"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    />
  </div>
</template>
