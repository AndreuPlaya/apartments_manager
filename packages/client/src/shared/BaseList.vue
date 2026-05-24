<script setup lang="ts">
defineProps<{
  isEmpty: boolean
  emptyMessage?: string
}>()
</script>

<template>
  <div v-if="isEmpty" class="empty-state"><p>{{ emptyMessage ?? 'No items found.' }}</p></div>
  <div v-else class="table-wrap">
    <table>
      <thead>
        <tr>
          <slot name="header" />
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>
