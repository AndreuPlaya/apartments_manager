<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import AppIcon from '../AppIcon.vue'

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

const effectiveStep = computed(() => props.step ?? 1)

const canDecrement = computed(() =>
  props.min === undefined || props.modelValue - effectiveStep.value >= props.min
)
const canIncrement = computed(() =>
  props.max === undefined || props.modelValue + effectiveStep.value <= props.max
)

function decrement(e: MouseEvent) {
  e.stopPropagation()
  if (props.rights === false || !canDecrement.value) return
  const next = Math.round((props.modelValue - effectiveStep.value) * 1e10) / 1e10
  emit('update:modelValue', next)
}

function increment(e: MouseEvent) {
  e.stopPropagation()
  if (props.rights === false || !canIncrement.value) return
  const next = Math.round((props.modelValue + effectiveStep.value) * 1e10) / 1e10
  emit('update:modelValue', next)
}

function startEdit(e: MouseEvent) {
  e.stopPropagation()
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
  if (isNaN(val) || val === props.modelValue) return
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
  >
    <span class="detail-field__label">{{ text }}</span>

    <template v-if="!editing">
      <div class="field-stepper">
        
        <span class="stepper-val" @click="startEdit">{{ displayValue() }}</span>
        <button
          class="stepper-btn"
          :disabled="rights === false || !canDecrement"
          @click="decrement"
          tabindex="-1"
          aria-label="Decrease"
        ><AppIcon name="minus" :size="11" :stroke-width="2.5" /></button>
        <button
          class="stepper-btn"
          :disabled="rights === false || !canIncrement"
          @click="increment"
          tabindex="-1"
          aria-label="Increase"
        ><AppIcon name="plus" :size="11" :stroke-width="2.5" /></button>
      </div>
    </template>

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
