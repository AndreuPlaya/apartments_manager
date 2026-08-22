<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CalendarLink, Listing, Channel } from '../api/client'
import AppIcon from './AppIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  /** Pre-filtered links for this channel or listing */
  links: CalendarLink[]
  listings: Listing[]
  channels: Channel[]
  isAdmin: boolean
  /** 'by-listing': contextId is a channelId, rows are listings
   *  'by-channel':   contextId is an listingId, rows are channels */
  mode: 'by-listing' | 'by-channel'
  contextId: string
}>()

const emit = defineEmits<{
  save: [channelId: string, listingId: string, url: string]
  delete: [id: string]
}>()

// ── Rows: always show ALL entities ──────────────────────────────────────────

interface Row {
  entityId: string
  entityName: string
  link: CalendarLink | undefined
}

const rows = computed((): Row[] => {
  const entities: { id: string; name: string }[] =
    props.mode === 'by-listing' ? props.listings : props.channels
  return entities.map(entity => ({
    entityId: entity.id,
    entityName: entity.name,
    link: props.links.find(l =>
      props.mode === 'by-listing' ? l.listingId === entity.id : l.channelId === entity.id,
    ),
  }))
})

// ── Inline URL editing ──────────────────────────────────────────────────────

const editingEntityId = ref<string | null>(null)
const editingUrl = ref('')

/**
 * Function ref called by Vue when the <input> mounts/unmounts.
 * Because the input is inside v-for, using a string ref="x" gives us an array.
 * Using :ref="(el) => ..." gives us the element directly and lets us focus immediately.
 */
function focusInput(el: unknown) {
  if (el instanceof HTMLInputElement) {
    el.focus()
    el.select()
  }
}

function startEdit(row: Row) {
  if (!props.isAdmin) return
  editingEntityId.value = row.entityId
  editingUrl.value = row.link?.url ?? ''
}

function commitEdit(row: Row) {
  if (editingEntityId.value !== row.entityId) return
  editingEntityId.value = null
  const url = editingUrl.value.trim()
  if (!url) return
  if (url === row.link?.url) return
  const channelId = props.mode === 'by-listing' ? props.contextId : row.entityId
  const listingId = props.mode === 'by-channel' ? props.contextId : row.entityId
  emit('save', channelId, listingId, url)
}

function cancelEdit() {
  editingEntityId.value = null
  editingUrl.value = ''
}
</script>

<template>
  <div class="calendar-panel">
    <span class="panel-label">
      <AppIcon name="calendar" :size="13" :stroke-width="2" class="panel-icon" />
      {{ t('calendar.calendarUrls') }}
    </span>

    <table v-if="rows.length > 0" class="sub-table">
      <thead>
        <tr>
          <th>{{ mode === 'by-listing' ? t('calendar.listing') : t('calendar.channel') }}</th>
          <th>{{ t('calendar.urlCol') }}</th>
          <th v-if="props.isAdmin" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.entityId"
          class="cal-row"
        >
          <td class="cal-row__name">{{ row.entityName }}</td>

          <!-- URL cell: click to edit (admin only) -->
          <td
            :class="['cal-row__url', props.isAdmin && editingEntityId !== row.entityId && 'cal-row__url--editable']"
            @click.stop="startEdit(row)"
          >
            <template v-if="editingEntityId !== row.entityId">
              <span v-if="row.link?.url" class="url-val" :title="row.link.url">
                {{ row.link.url }}
              </span>
              <span v-else class="url-placeholder">—</span>
            </template>
            <input
              v-else
              :ref="(el) => focusInput(el)"
              v-model="editingUrl"
              class="url-input"
              type="url"
              placeholder="https://…"
              @blur="commitEdit(row)"
              @keydown.enter.prevent="commitEdit(row)"
              @keydown.escape.prevent="cancelEdit"
              @click.stop
            />
          </td>

          <!-- Actions: delete only (admin only) -->
          <td v-if="props.isAdmin" class="cal-row__actions">
            <button
              v-if="row.link && editingEntityId !== row.entityId"
              class="icon-btn icon-btn--danger"
              :title="t('calendar.removeUrl')"
              @click.stop="emit('delete', row.link.id)"
            >
              <AppIcon name="trash" :size="13" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="cal-empty">
      {{ mode === 'by-listing' ? t('calendar.noListingsConfig') : t('calendar.noChannelsConfig') }}
    </div>
  </div>
</template>

