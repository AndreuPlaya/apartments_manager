<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: number
  strokeWidth?: number
}>(), {
  size: 16,
  strokeWidth: 2,
})

const icons: Record<string, string> = {
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  'chevron-left':  '<polyline points="15 18 9 12 15 6"/>',
  'chevron-up':    '<polyline points="18 15 12 9 6 15"/>',
  'chevron-down':  '<polyline points="6 9 12 15 18 9"/>',
  'chevron-up-down':
    '<polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/>',

  'arrow-up':
    '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
  'arrow-down':
    '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  'arrow-right':
    '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',

  'trash':
    '<polyline points="3 6 5 6 21 6"/>' +
    '<path d="M19 6l-1 14H6L5 6"/>' +
    '<path d="M10 11v6"/>' +
    '<path d="M14 11v6"/>' +
    '<path d="M9 6V4h6v2"/>',

  'trash-open':
    '<path d="M19 6l-1 14H6L5 6"/>' +
    '<path d="M10 11v6"/>' +
    '<path d="M14 11v6"/>' +
    '<g transform="rotate(-15 5 6)">' +
      '<polyline points="3 6 5 6 21 6"/>' +
      '<path d="M9 6V4h6v2"/>' +
    '</g>',

  'x':
    '<line x1="18" y1="6" x2="6" y2="18"/>' +
    '<line x1="6" y1="6" x2="18" y2="18"/>',

  'plus':
    '<line x1="12" y1="5" x2="12" y2="19"/>' +
    '<line x1="5" y1="12" x2="19" y2="12"/>',

  'list':
    '<line x1="8" y1="6" x2="21" y2="6"/>' +
    '<line x1="8" y1="12" x2="21" y2="12"/>' +
    '<line x1="8" y1="18" x2="21" y2="18"/>' +
    '<line x1="3" y1="6" x2="3" y2="6"/>' +
    '<line x1="3" y1="12" x2="3" y2="12"/>' +
    '<line x1="3" y1="18" x2="3" y2="18"/>',

  'calendar':
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
    '<line x1="16" y1="2" x2="16" y2="6"/>' +
    '<line x1="8" y1="2" x2="8" y2="6"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/>',
}
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
