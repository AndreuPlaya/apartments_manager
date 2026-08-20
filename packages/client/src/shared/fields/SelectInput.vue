<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppIcon from '../AppIcon.vue'

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

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const displayLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label ?? props.placeholder ?? '—'
)

const isPlaceholderActive = computed(
  () => !props.modelValue && !!props.placeholder
)

function openDropdown() {
  if (props.rights === false) return
  const rect = triggerRef.value!.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownHeight = Math.min(props.options.length * 40 + 12, 220)
  const openUpward = spaceBelow < dropdownHeight + 8 && rect.top > dropdownHeight + 8

  dropdownStyle.value = {
    width: `${rect.width}px`,
    left: `${rect.left}px`,
    ...(openUpward
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  }
  isOpen.value = true
}

function selectOption(val: string) {
  isOpen.value = false
  if (val !== props.modelValue) emit('update:modelValue', val)
}

// The browser focuses an invalid control to show its validation bubble; hand
// that focus to the visible trigger, since the mirror input is invisible.
function focusTrigger() {
  triggerRef.value?.focus()
}

function handleScroll() {
  if (isOpen.value) isOpen.value = false
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true, capture: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll, { capture: true }))
</script>

<template>
  <!-- Form mode -->
  <div v-if="mode === 'form'" class="form-group">
    <label>{{ text }}</label>
    <div class="custom-select-wrap">
      <div
        ref="triggerRef"
        class="custom-select-trigger"
        :class="{ 'custom-select-trigger--open': isOpen, 'custom-select-trigger--placeholder': isPlaceholderActive }"
        role="combobox"
        :aria-expanded="isOpen"
        tabindex="0"
        @click="openDropdown"
        @keydown.enter.prevent="openDropdown"
        @keydown.space.prevent="openDropdown"
        @keydown.escape.prevent="isOpen = false"
      >
        <span>{{ displayLabel }}</span>
        <AppIcon name="chevron-down" :size="14" :stroke-width="2" class="chevron" :class="{ 'chevron--open': isOpen }" />
      </div>
      <!--
        The trigger is a <div>, which the browser cannot validate. This mirror
        input carries `required` so a required select blocks submit like every
        other field in the form. It must stay visible to the layout engine —
        browsers skip validation for display:none controls.
      -->
      <input
        class="custom-select-validity"
        :value="modelValue"
        :required="required"
        tabindex="-1"
        aria-hidden="true"
        @focus="focusTrigger"
      />
    </div>
  </div>

  <!-- Inline mode -->
  <div v-else
    :class="['detail-field', isOpen && 'select-field--open', rights === false && 'detail-field--readonly', wide && 'detail-field--wide']"
  >
    <span class="detail-field__label">{{ text }}</span>
    <div
      ref="triggerRef"
      class="inline-select-trigger"
      :class="{ 'inline-select-trigger--open': isOpen }"
      @click.stop="openDropdown"
    >
      <span class="detail-field__val">{{ displayLabel }}</span>
      <AppIcon name="chevron-down" :size="14" :stroke-width="2" class="chevron" :class="{ 'chevron--open': isOpen }" />
    </div>
  </div>

  <!-- Teleported dropdown (shared for both modes) -->
  <Teleport to="body">
    <div v-if="isOpen" class="select-backdrop" @click="isOpen = false" />
    <ul
      v-if="isOpen"
      class="select-dropdown"
      :style="dropdownStyle"
      role="listbox"
    >
      <li
        v-if="placeholder && mode === 'form'"
        class="select-option select-option--placeholder"
        @click="selectOption('')"
      >{{ placeholder }}</li>
      <li
        v-for="opt in options"
        :key="opt.value"
        class="select-option"
        :class="{ 'select-option--active': opt.value === modelValue }"
        role="option"
        :aria-selected="opt.value === modelValue"
        @click="selectOption(opt.value)"
      >{{ opt.label }}</li>
    </ul>
  </Teleport>
</template>

