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
</script>

<template>
  <!-- Form mode -->
  <div v-if="mode === 'form'" class="form-group">
    <label class="form-checkbox">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      {{ text }}
    </label>
  </div>

  <!-- Inline: two-line — header label above, checkbox with label below (BookingItem crib style) -->
  <div v-else-if="checkboxLabel"
    :class="['detail-field', rights === false && 'detail-field--readonly']"
    @click.stop
  >
    <span class="detail-field__label">{{ text }}</span>
    <label class="detail-field__checkbox">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="rights === false"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        @click.stop
      />
      {{ checkboxLabel }}
    </label>
  </div>

  <!-- Inline: single-line — checkbox + text in same row (ApartmentItem/ChannelItem style) -->
  <div v-else
    :class="['detail-field', 'detail-field--checkbox', rights === false && 'detail-field--readonly']"
    @click.stop
  >
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="rights === false"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      @click.stop
    />
    <span class="detail-field__label" style="margin-bottom:0">{{ text }}</span>
  </div>
</template>
