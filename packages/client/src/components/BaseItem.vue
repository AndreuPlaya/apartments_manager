<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'
import TrashIcon from './TrashIcon.vue'

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
          v-if="canDelete"
          class="btn btn--ghost btn--sm btn--icon text-danger"
          :disabled="loading"
          title="Delete"
          @click.stop="emit('delete')"
        >
          <TrashIcon :size="13" />
        </button>
        <button
          class="btn btn--ghost btn--sm expand-btn"
          :title="expanded ? 'Collapse' : 'Expand'"
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
          <slot name="drawer" />
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.base-item-row--expanded td {
  background: rgba(37, 99, 235, 0.03);
}

/* ── Actions ────────────────────────────────────────────────── */

.actions-cell {
  width: 5rem;
  text-align: right;
  white-space: nowrap;
}

.expand-btn {
  min-width: 1.75rem;
  padding: 0.15rem 0.4rem;
}

.arrow {
  display: inline-block;
  color: var(--text-muted);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s;
}

.expand-btn:hover .arrow { color: var(--text); }
.arrow--open { transform: rotate(90deg); }

/* ── Drawer row ─────────────────────────────────────────────── */

.drawer-row td { padding: 0 !important; border-bottom: none; }

.drawer-cell {
  padding: 0 !important;
  border-bottom: none;
}

.drawer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer--open {
  grid-template-rows: 1fr;
}

.drawer__inner {
  overflow: hidden;
  border-top: 0;
  transition: border-top-color 0.22s;
}

.drawer--open .drawer__inner {
  border-top: 1px solid var(--border);
}
</style>

<!-- Shared detail-field styles consumed by all *Item components via :deep() or global -->
<style>
.details-panel {
  position: relative;
  padding: 0.875rem 0.875rem 0.75rem;
  background: var(--bg);
  border-left: 3px solid var(--accent);
}

.panel-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem 1rem;
}

@media (max-width: 900px) {
  .details-grid { grid-template-columns: repeat(2, 1fr); }
}

.details-grid--3col {
  grid-template-columns: repeat(3, 1fr);
}

.detail-field {
  cursor: text;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.12s;
  border: 1px solid transparent;
  min-width: 0;
}

.detail-field:hover {
  background: rgba(37, 99, 235, 0.06);
  border-color: var(--border);
}

.detail-field--wide {
  grid-column: 1 / -1;
}

.detail-field--editing {
  background: var(--accent-light);
  border-color: var(--accent);
  padding: 0;
}

.detail-field--readonly {
  cursor: default;
}

.detail-field--readonly:hover {
  background: transparent;
  border-color: transparent;
}

.detail-field__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
  padding: 0;
}

.detail-field--editing .detail-field__label {
  padding: 0.3rem 0.5rem 0;
}

.detail-field__val {
  display: block;
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-field__val--pre {
  white-space: pre-wrap;
}

.detail-field--editing input,
.detail-field--editing select,
.detail-field--editing textarea {
  width: 100%;
  padding: 0.2rem 0.5rem 0.35rem;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  color: var(--text);
  outline: none;
  border-radius: 0;
  box-shadow: none;
  resize: none;
}

.detail-delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.3rem;
}

.detail-field--checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.detail-field--checkbox:hover {
  background: rgba(37, 99, 235, 0.06);
  border-color: var(--border);
}

.detail-field--checkbox input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}
</style>
