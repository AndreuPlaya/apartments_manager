<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  modelValue: string
  rights?: boolean
  wide?: boolean
  mode?: 'inline' | 'form'
  required?: boolean
}>(), { rights: true })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

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
  const val = draft.value
  if (val === (props.modelValue ?? '')) return
  emit('update:modelValue', val)
}
</script>

<template>
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <input type="date" v-model="model" :required="required" />
  </div>

  <div v-else
    :class="['detail-field', editing && 'detail-field--editing', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
    @click="startEdit"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val">{{ formatDate(modelValue) }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="draft"
      type="date"
      @blur="commit"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @click.stop
    />
  </div>
</template>
