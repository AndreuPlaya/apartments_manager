<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '../AppIcon.vue'

const THEMES = [
  { value: 'dark', swatch: '#1f1c18', labelKey: 'profile.themeDark' },
  { value: 'light', swatch: '#f7f2e7', labelKey: 'profile.themeLight' },
] as const

const props = defineProps<{
  text: string
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const selected = computed(() => THEMES.find(x => x.value === props.modelValue) ?? THEMES[0])

function openDropdown() {
  const rect = triggerRef.value!.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownHeight = THEMES.length * 44 + 12
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

function select(val: string) {
  emit('update:modelValue', val)
  isOpen.value = false
}

function handleScroll() { if (isOpen.value) isOpen.value = false }

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true, capture: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll, { capture: true }))
</script>

<template>
  <div
    ref="triggerRef"
    :class="['detail-field', 'detail-field--checkbox', isOpen && 'select-field--open']"
    @click.stop="openDropdown"
  >
    <span class="detail-field__label">{{ text }}</span>
    <div class="pf-lang-display">
      <span class="pf-theme-swatch" :style="{ background: selected.swatch }" />
      <span class="detail-field__val">{{ t(selected.labelKey) }}</span>
      <AppIcon name="chevron-down" :size="12" :stroke-width="2.5" class="chevron" :class="{ 'chevron--open': isOpen }" />
    </div>
  </div>

  <Teleport to="body">
    <div v-if="isOpen" class="select-backdrop" @click="isOpen = false" />
    <ul v-if="isOpen" class="select-dropdown" :style="dropdownStyle" role="listbox">
      <li
        v-for="theme in THEMES"
        :key="theme.value"
        class="select-option pf-lang-option"
        :class="{ 'select-option--active': theme.value === modelValue }"
        role="option"
        :aria-selected="theme.value === modelValue"
        @click="select(theme.value)"
      >
        <span class="pf-theme-swatch" :style="{ background: theme.swatch }" />
        {{ t(theme.labelKey) }}
      </li>
    </ul>
  </Teleport>
</template>
