<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  modelValue: boolean
  rights?: boolean
  checkboxLabel?: string
  mode?: 'inline' | 'form'
}>(), { rights: true })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (props.rights === false) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <!-- Form mode -->
  <div v-if="mode === 'form'" class="form-group">
    <label class="form-checkbox" @click.prevent="toggle">
      <span
        class="custom-cb"
        :class="{ 'custom-cb--checked': modelValue, 'custom-cb--readonly': rights === false }"
      >
        <svg class="custom-cb__check" :class="{ 'custom-cb__check--visible': modelValue }" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4l3 3 5-5" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      {{ text }}
      <input type="checkbox" :checked="modelValue" style="display:none" :disabled="rights === false" />
    </label>
  </div>

  <!-- Inline: two-line — header label above, custom checkbox with label below -->
  <div v-else-if="checkboxLabel"
    :class="['detail-field', rights === false && 'detail-field--readonly']"
    @click.stop
  >
    <span class="detail-field__label">{{ text }}</span>
    <label class="detail-field__checkbox" @click.prevent="toggle">
      <span
        class="custom-cb"
        :class="{ 'custom-cb--checked': modelValue, 'custom-cb--readonly': rights === false }"
      >
        <svg class="custom-cb__check" :class="{ 'custom-cb__check--visible': modelValue }" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4l3 3 5-5" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      {{ checkboxLabel }}
      <input type="checkbox" :checked="modelValue" style="display:none" :disabled="rights === false" />
    </label>
  </div>

  <!-- Inline: label on top, checkbox below -->
  <div v-else
    :class="['detail-field', 'detail-field--checkbox', rights === false && 'detail-field--readonly']"
    @click.stop="toggle"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span
      class="custom-cb"
      :class="{ 'custom-cb--checked': modelValue, 'custom-cb--readonly': rights === false }"
    >
      <svg class="custom-cb__check" :class="{ 'custom-cb__check--visible': modelValue }" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4l3 3 5-5" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <input type="checkbox" :checked="modelValue" style="display:none" :disabled="rights === false" />
  </div>
</template>

