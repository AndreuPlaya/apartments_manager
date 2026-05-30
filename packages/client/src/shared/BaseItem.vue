<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import TrashIcon from './TrashIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  colSpan: number
  loading?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()

const expanded = ref(false)
</script>

<template>
  <tr
    class="base-item-row"
    :class="{ 'base-item-row--expanded': expanded }"
    style="cursor: pointer"
    @click="expanded = !expanded"
  >
    <slot name="summary" />
    <td class="actions-cell">
      <div class="action-btns">
        <slot name="extra-actions" />
        <button
          class="btn btn--ghost btn--sm expand-btn"
          :title="expanded ? t('common.collapse') : t('common.expand')"
          @click.stop="expanded = !expanded"
        >
          <AppIcon name="chevron-right" :size="14" :class="['arrow', expanded && 'arrow--open']" />
        </button>
      </div>
    </td>
  </tr>

  <tr class="drawer-row">
    <td :colspan="colSpan" class="drawer-cell">
      <div class="drawer" :class="{ 'drawer--open': expanded }">
        <div class="drawer__inner">
          <button
            v-if="canDelete"
            class="btn btn--ghost btn--sm btn--icon drawer-delete-btn"
            :disabled="loading"
            :title="t('common.delete')"
            @click.stop="emit('delete')"
          >
            <TrashIcon :size="13" />
          </button>
          <slot name="drawer" />
        </div>
      </div>
    </td>
  </tr>
</template>

