<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: number
  strokeWidth?: number
}>(), {
  size: 16,
  strokeWidth: 2,
})

const rawSvgs = import.meta.glob('../../res/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const icons: Record<string, string> = Object.fromEntries(
  Object.entries(rawSvgs).map(([path, raw]) => {
    const name = path.replace(/.*\/(.+)\.svg$/, '$1')
    const inner = raw.replace(/^[\s\S]*?<svg[^>]*>([\s\S]*)<\/svg>[\s\S]*$/, '$1').trim()
    return [name, inner]
  })
)
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    style="display: inline-block; vertical-align: middle; flex-shrink: 0;"
    v-html="icons[props.name]"
  />
</template>
