<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: number
  rights?: boolean
  wide?: boolean
  mode?: 'inline' | 'form'
  required?: boolean
  currency?: string
  min?: number
}>(), { rights: true, currency: '€', min: 0 })

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function fmt(v: number) {
  return v.toFixed(2)
}

function startEdit() {
  if (props.rights === false) return
  draft.value = fmt(props.modelValue)
  editing.value = true
  nextTick(() => { inputRef.value?.focus(); inputRef.value?.select() })
}

function cancel() {
  editing.value = false
}

function commit() {
  editing.value = false
  const cleaned = draft.value.replace(/[^0-9.,-]/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  if (isNaN(val)) return
  const clamped = Math.max(props.min, val)
  const rounded = Math.round(clamped * 100) / 100
  if (rounded === props.modelValue) return
  emit('update:modelValue', rounded)
}
</script>

<template>
  <!-- Form mode: input group with currency badge on the right -->
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <div class="currency-group">
      <input
        type="number"
        :value="modelValue"
        :min="min"
        step="0.01"
        :required="required"
        class="currency-group__input"
        @change="emit('update:modelValue', Math.round(Math.max(min, +($event.target as HTMLInputElement).value || 0) * 100) / 100)"
      />
      <span class="currency-group__badge">{{ currency }}</span>
    </div>
  </div>

  <!-- Inline mode -->
  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>

    <!-- Display state: amount then symbol -->
    <span v-if="!editing" class="currency-display">
      <span class="currency-display__amount">{{ fmt(modelValue) }}</span>
      <span class="currency-display__symbol">{{ currency }}</span>
    </span>

    <!-- Edit state: input then € symbol -->
    <div v-else class="currency-edit" @click.stop>
      <input
        ref="inputRef"
        v-model="draft"
        type="text"
        inputmode="decimal"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.escape.prevent="cancel"
        @click.stop
      />
      <span class="currency-edit__suffix">{{ currency }}</span>
    </div>
  </div>
</template>

