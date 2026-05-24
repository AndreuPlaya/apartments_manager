<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalendarLink, Apartment, Channel } from '../api/client'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  /** Pre-filtered links for this channel or apartment */
  links: CalendarLink[]
  apartments: Apartment[]
  channels: Channel[]
  isAdmin: boolean
  /** 'by-apartment': contextId is a channelId, rows are apartments
   *  'by-channel':   contextId is an apartmentId, rows are channels */
  mode: 'by-apartment' | 'by-channel'
  contextId: string
}>()

const emit = defineEmits<{
  save: [channelId: string, apartmentId: string, url: string]
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
    props.mode === 'by-apartment' ? props.apartments : props.channels
  return entities.map(entity => ({
    entityId: entity.id,
    entityName: entity.name,
    link: props.links.find(l =>
      props.mode === 'by-apartment' ? l.apartmentId === entity.id : l.channelId === entity.id,
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
  const channelId = props.mode === 'by-apartment' ? props.contextId : row.entityId
  const apartmentId = props.mode === 'by-channel' ? props.contextId : row.entityId
  emit('save', channelId, apartmentId, url)
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
      Calendar URLs
    </span>

    <table v-if="rows.length > 0" class="sub-table">
      <thead>
        <tr>
          <th>{{ mode === 'by-apartment' ? 'Apartment' : 'Channel' }}</th>
          <th>Calendar URL</th>
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
              title="Remove URL"
              @click.stop="emit('delete', row.link.id)"
            >
              <AppIcon name="trash" :size="13" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="cal-empty">
      No {{ mode === 'by-apartment' ? 'apartments' : 'channels' }} configured yet
    </div>
  </div>
</template>

<style scoped>
.calendar-panel {
  padding: 0.75rem 0.875rem 0.75rem;
  background: var(--card);
  border-left: 3px solid var(--border-dark);
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.panel-icon { opacity: 0.7; }

/* ── table ── */

.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.sub-table th,
.sub-table td {
  padding: 0.4rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.sub-table thead th {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sub-table tbody tr:last-child td { border-bottom: none; }

/* ── cells ── */

.cal-row__name {
  white-space: nowrap;
  min-width: 8rem;
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-row__url { width: 100%; }
.cal-row__url--editable { cursor: text; }

.cal-row:hover td { background: var(--accent-light); }

.url-val {
  display: block;
  font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace);
  font-size: 0.75rem;
  max-width: 42ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.url-input {
  width: 100%;
  font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace);
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border: 1.5px solid var(--accent, #3b82f6);
  border-radius: 3px;
  background: var(--input-bg, var(--card));
  color: var(--text);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #3b82f6) 20%, transparent);
}

/* ── action buttons ── */

.cal-row__actions {
  width: 4rem;
  text-align: right;
  white-space: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  border-radius: 3px;
  color: var(--text-muted);
  line-height: 1;
  transition: color 0.15s, background 0.15s;
  vertical-align: middle;
  opacity: 0;
}

.cal-row:hover .icon-btn { opacity: 1; }

.icon-btn--danger:hover {
  color: var(--danger, #ef4444);
  background: color-mix(in srgb, var(--danger, #ef4444) 10%, transparent);
}

/* ── empty ── */

.cal-empty {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 0.5rem 0.25rem;
  border: 1px dashed var(--border);
  border-radius: 4px;
  text-align: center;
}
</style>
