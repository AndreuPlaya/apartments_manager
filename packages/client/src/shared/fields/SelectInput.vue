<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: string
  options: { value: string; label: string }[]
  rights?: boolean
  wide?: boolean
  mode?: 'inline' | 'form'
  required?: boolean
  placeholder?: string
}>(), { rights: true })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLSelectElement | null>(null)

const displayLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? '—'
)

function startEdit() {
  if (props.rights === false) return
  draft.value = props.modelValue
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function cancel() {
  editing.value = false
}

function commit() {
  editing.value = false
  if (draft.value === props.modelValue) return
  emit('update:modelValue', draft.value)
}
</script>

<template>
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <select v-model="model" :required="required">
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>

  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val">{{ displayLabel }}</span>
    <select
      v-else
      ref="inputRef"
      v-model="draft"
      @change="commit"
      @blur="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
