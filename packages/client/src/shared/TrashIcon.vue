<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(defineProps<{ size?: number }>(), { size: 14 })

const open = ref(false)
const T = 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
</script>

<template>
  <span class="trash-icon" @mouseenter="open = true" @mouseleave="open = false">
    <AppIcon name="trash"      :size="props.size" :style="{ opacity: open ? 0 : 1, transition: T }" />
    <AppIcon name="trash-open" :size="props.size" :style="{ opacity: open ? 1 : 0, transition: T }" class="trash-icon__open" />
  </span>
</template>
