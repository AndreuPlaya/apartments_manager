<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Client, Booking, Apartment, Channel } from '../api/client'
import AppIcon from './AppIcon.vue'
import TrashIcon from './TrashIcon.vue'

const props = defineProps<{
  client: Client
  bookings: Booking[]
  apartments: Apartment[]
  channels: Channel[]
  loading: boolean
}>()

const emit = defineEmits<{
  update: [client: Client, patch: Partial<Omit<Client, 'id'>>]
  delete: [client: Client]
  editBooking: [booking: Booking]
}>()

const expanded = ref(false)

const editingField = ref<keyof Client | null>(null)
const editingValue = ref('')
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

async function startEdit(field: keyof Client, e?: MouseEvent) {
  e?.stopPropagation()
  editingField.value = field
  editingValue.value = String(props.client[field] ?? '')
  await nextTick()
  inputRef.value?.focus()
  ;(inputRef.value as HTMLInputElement)?.select?.()
}

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null
  const val = editingValue.value.trim()
  const current = String(props.client[field] ?? '')
  if (val === current) return
  emit('update', props.client, { [field]: val || undefined })
}

function cancelEdit() {
  editingField.value = null
}

function apartmentName(id: string) {
  return props.apartments.find(a => a.id === id)?.name ?? id
}

const statusClass: Record<string, string> = {
  Paid: 'badge--paid',
  NotPaid: 'badge--notpaid',
  Cancelled: 'badge--cancelled',
}

const statusLabel: Record<string, string> = {
  Paid: 'Paid',
  NotPaid: 'Not paid',
  Cancelled: 'Cancelled',
}
</script>

<template>
  <!-- Main row: Name · ID · Email · Phone · Actions -->
  <tr class="client-row" :class="{ 'client-row--expanded': expanded }">
    <td :class="['editable-cell', editingField === 'name' && 'editing']" @click="startEdit('name')">
      <span v-if="editingField !== 'name'" class="cell-val">{{ client.name || '—' }}</span>
      <input v-else ref="inputRef" v-model="editingValue"
        @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
    </td>
    <td :class="['editable-cell', editingField === 'identityDocument' && 'editing']" @click="startEdit('identityDocument')">
      <span v-if="editingField !== 'identityDocument'" class="cell-val">{{ client.identityDocument ?? '—' }}</span>
      <input v-else ref="inputRef" v-model="editingValue"
        @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
    </td>
    <td :class="['editable-cell', editingField === 'email' && 'editing']" @click="startEdit('email')">
      <span v-if="editingField !== 'email'" class="cell-val">{{ client.email ?? '—' }}</span>
      <input v-else ref="inputRef" v-model="editingValue" type="email"
        @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
    </td>
    <td :class="['editable-cell', editingField === 'phoneNumber' && 'editing']" @click="startEdit('phoneNumber')">
      <span v-if="editingField !== 'phoneNumber'" class="cell-val">{{ client.phoneNumber ?? '—' }}</span>
      <input v-else ref="inputRef" v-model="editingValue"
        @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
    </td>
    <td class="actions-cell">
      <div class="action-btns">
        <button class="btn btn--ghost btn--sm expand-btn" :title="expanded ? 'Collapse' : 'Expand'"
          @click.stop="expanded = !expanded">
          <AppIcon name="chevron-right" :size="14" :class="['arrow', expanded && 'arrow--open']" />
        </button>
        <button v-if="bookings.length === 0" class="btn btn--ghost btn--sm btn--icon text-danger"
          :disabled="loading" title="Delete client" @click.stop="emit('delete', client)">
          <TrashIcon :size="13" />
        </button>
        
      </div>
    </td>
  </tr>

  <!-- Expandable drawer — always rendered, animated via grid-template-rows -->
  <tr class="drawer-row">
    <td colspan="5" class="drawer-cell">
      <div class="drawer" :class="{ 'drawer--open': expanded }">
        <div class="drawer__inner">

          <!-- Extra editable details -->
          <div class="details-panel">
            <span class="panel-label">Details</span>
            <div class="details-grid">

              <div :class="['detail-field', editingField === 'city' && 'detail-field--editing']"
                @click="startEdit('city')">
                <span class="detail-field__label">City</span>
                <span v-if="editingField !== 'city'" class="detail-field__val">{{ client.city || '—' }}</span>
                <input v-else ref="inputRef" v-model="editingValue" placeholder="City"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <div :class="['detail-field', editingField === 'country' && 'detail-field--editing']"
                @click="startEdit('country')">
                <span class="detail-field__label">Country</span>
                <span v-if="editingField !== 'country'" class="detail-field__val">{{ client.country || '—' }}</span>
                <input v-else ref="inputRef" v-model="editingValue" placeholder="Country"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <div :class="['detail-field', editingField === 'zipCode' && 'detail-field--editing']"
                @click="startEdit('zipCode')">
                <span class="detail-field__label">ZIP code</span>
                <span v-if="editingField !== 'zipCode'" class="detail-field__val">{{ client.zipCode || '—' }}</span>
                <input v-else ref="inputRef" v-model="editingValue" placeholder="ZIP"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <div :class="['detail-field', editingField === 'street' && 'detail-field--editing']"
                @click="startEdit('street')">
                <span class="detail-field__label">Street</span>
                <span v-if="editingField !== 'street'" class="detail-field__val">{{ client.street || '—' }}</span>
                <input v-else ref="inputRef" v-model="editingValue" placeholder="Street"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <div :class="['detail-field', 'detail-field--wide', editingField === 'comment' && 'detail-field--editing']"
                @click="startEdit('comment')">
                <span class="detail-field__label">Comment</span>
                <span v-if="editingField !== 'comment'" class="detail-field__val detail-field__val--pre">{{ client.comment || '—' }}</span>
                <textarea v-else ref="inputRef" v-model="editingValue" rows="2" placeholder="Comment"
                  @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

            </div>
          </div>

          <!-- Bookings sub-table -->
          <div v-if="bookings.length > 0" class="bookings-panel">
            <span class="panel-label">Bookings</span>
            <table class="sub-table">
              <thead>
                <tr>
                  <th>From</th><th>To</th><th>Apartment</th><th>Status</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in bookings" :key="b.id" class="booking-row" @click="emit('editBooking', b)">
                  <td>{{ b.fromDate }}</td>
                  <td>{{ b.toDate }}</td>
                  <td>{{ apartmentName(b.apartmentId) }}</td>
                  <td><span :class="['badge', statusClass[b.status]]">{{ statusLabel[b.status] }}</span></td>
                  <td>{{ b.totalAmountDue }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
/* ── Main row ───────────────────────────────────────────────── */

.client-row--expanded .editable-cell,
.client-row--expanded .actions-cell {
  background: rgba(37, 99, 235, 0.03);
}

/* ── Editable cells (main row) ──────────────────────────────── */

.editable-cell {
  cursor: text;
  transition: background 0.12s;
}

.editable-cell:hover {
  background: rgba(37, 99, 235, 0.05) !important;
}

.editable-cell.editing {
  padding: 0;
}

.editable-cell.editing input {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: none;
  border-bottom: 2px solid var(--accent);
  background: var(--accent-light);
  font-size: 0.875rem;
  color: var(--text);
  outline: none;
  border-radius: 0;
  box-shadow: none;
}

.cell-val { display: block; }

/* ── Actions ────────────────────────────────────────────────── */

.expand-btn {
  min-width: 1.75rem;
  padding: 0.15rem 0.4rem;
}

.arrow {
  display: inline-block;
  color: var(--text-muted);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.15s;
}

.expand-btn:hover .arrow { color: var(--text); }
.arrow--open { transform: rotate(90deg); }

/* ── Drawer row ─────────────────────────────────────────────── */

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

/* ── Panel structure ────────────────────────────────────────── */

.details-panel {
  padding: 0.875rem 0.875rem 0.75rem;
  background: var(--bg);
  border-left: 3px solid var(--accent);
}

.bookings-panel {
  padding: 0.75rem 0.875rem 0;
  background: var(--card);
  border-left: 3px solid var(--border-dark);
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

/* ── Details grid ───────────────────────────────────────────── */

.details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem 1rem;
}

@media (max-width: 900px) {
  .details-grid { grid-template-columns: repeat(2, 1fr); }
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

/* ── Bookings sub-table ─────────────────────────────────────── */

.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  margin-bottom: 0;
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
  background: transparent;
}

.sub-table tbody tr:last-child td { border-bottom: none; }

.booking-row { cursor: pointer; }
.booking-row:hover td { background: var(--accent-light) !important; }
</style>
