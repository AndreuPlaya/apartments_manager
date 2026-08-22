<script setup lang="ts">
// Conmutador de dos estados. El estado no lo lleva solo el color: el pulgar se
// desplaza, así que se lee igual sin distinguir el azul (docs/UX.md §3).
const props = defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="app-switch"
    :class="{ 'app-switch--on': modelValue }"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="app-switch__thumb" />
  </button>
</template>
