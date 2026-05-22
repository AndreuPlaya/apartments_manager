<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import AppIcon from '../../components/AppIcon.vue'
import TrashIcon from '../../components/TrashIcon.vue'
import { useConfirm } from '../../composables/useConfirm'

const props = defineProps<{
  booking: Booking
  apartments: Apartment[]
  clients: Client[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  cancel: [booking: Booking]
  openClient: [client: Client]
}>()

const { confirm } = useConfirm()

const expanded = ref(false)

const editingField = ref<keyof Booking | null>(null)
const editingValue = ref('')
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)

const client = computed(() => props.clients.find(c => c.id === props.booking.clientId))
const apartment = computed(() => props.apartments.find(a => a.id === props.booking.apartmentId))
const channel = computed(() => props.channels.find(c => c.id === props.booking.channelId))

const isArriving = computed(() => props.booking.fromDate === props.today && props.booking.status !== 'Cancelled')
const isDeparting = computed(() => props.booking.toDate === props.today && props.booking.status !== 'Cancelled')
const isStaying = computed(() => props.booking.fromDate < props.today && props.booking.toDate > props.today && props.booking.status !== 'Cancelled')

const statusIcon = computed(() => {
  if (isArriving.value) return 'log-in'
  if (isDeparting.value) return 'log-out'
  if (isStaying.value) return 'home'
  return null
})

const guestString = computed(() => {
  const adults = props.booking.adultCount
  const children = props.booking.childrenCount
  return children > 0 ? `${adults} + (${children})` : String(adults)
})

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const adminOnlyFields: (keyof Booking)[] = [
  'apartmentId', 'channelId', 'fromDate', 'toDate',
  'adultCount', 'childrenCount', 'totalAmountDue',
]

async function startEdit(field: keyof Booking, e?: MouseEvent) {
  e?.stopPropagation()
  editingField.value = field
  editingValue.value = String(props.booking[field] ?? '')
  await nextTick()
  inputRef.value?.focus()
  ;(inputRef.value as HTMLInputElement)?.select?.()
}

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null

  const raw = editingValue.value
  const numericFields: (keyof Booking)[] = ['adultCount', 'childrenCount', 'totalAmountDue']
  let val: string | number | undefined = raw.trim()

  if (numericFields.includes(field)) {
    val = Number(raw)
  } else if (!val) {
    val = undefined
  }

  const current = props.booking[field]
  if (val === current) return
  if (val === undefined && current === undefined) return

  const isAdminField = adminOnlyFields.includes(field)

  if (isAdminField) {
    const payload: Partial<Omit<Booking, 'id' | 'createdAt'>> = {
      apartmentId: props.booking.apartmentId,
      clientId: props.booking.clientId,
      channelId: props.booking.channelId,
      fromDate: props.booking.fromDate,
      toDate: props.booking.toDate,
      adultCount: props.booking.adultCount,
      childrenCount: props.booking.childrenCount,
      status: props.booking.status,
      paidDate: props.booking.paidDate,
      totalAmountDue: props.booking.totalAmountDue,
      comment: props.booking.comment,
      [field]: val,
    }
    emit('update', props.booking.id, payload)
  } else {
    emit('patch', props.booking.id, { [field]: val } as { paidDate?: string; comment?: string })
  }
}

function cancelEdit() {
  editingField.value = null
}

async function handleCancel() {
  const aptName = apartment.value?.name ?? '—'
  const clientName = client.value?.name ?? '—'
  const dates = `${formatDate(props.booking.fromDate)} → ${formatDate(props.booking.toDate)}`
  const ok = await confirm(`Cancel booking?\n${aptName} · ${clientName}\n${dates}`)
  if (ok) emit('cancel', props.booking)
}
</script>

<template>
  <!-- Summary row: Apartment | Client | Check-in | Check-out | Guests | [chevron] -->
  <tr
    :class="{
      'row--arriving': isArriving,
      'row--staying': isStaying,
      'booking-row--expanded': expanded,
    }"
  >
    <td>{{ apartment?.name ?? '—' }}</td>
    <td>{{ client?.name ?? '—' }}</td>
    <td>{{ formatDate(booking.fromDate) }}</td>
    <td>{{ formatDate(booking.toDate) }}</td>
    <td>{{ guestString }}</td>
    <td class="expand-cell">
      <AppIcon v-if="statusIcon" :name="statusIcon" :size="14" class="status-icon" />
      <button class="btn btn--ghost btn--sm expand-btn" :title="expanded ? 'Collapse' : 'Expand'"
        @click.stop="expanded = !expanded">
        <AppIcon name="chevron-right" :size="14" :class="['arrow', expanded && 'arrow--open']" />
      </button>
    </td>
  </tr>

  <!-- Drawer row -->
  <tr class="drawer-row">
    <td colspan="6" class="drawer-cell">
      <div class="drawer" :class="{ 'drawer--open': expanded }">
        <div class="drawer__inner">

          <div class="details-panel">
            <span class="panel-label">Booking details</span>
            <button v-if="isAdmin" class="btn btn--ghost btn--sm btn--icon text-danger delete-btn"
              :disabled="loading" title="Cancel booking" @click.stop="handleCancel">
              <TrashIcon :size="13" />
            </button>
            <div class="details-grid">

              <!-- Apartment -->
              <div
                :class="['detail-field', editingField === 'apartmentId' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('apartmentId')"
              >
                <span class="detail-field__label">Apartment</span>
                <span v-if="editingField !== 'apartmentId'" class="detail-field__val">{{ apartment?.name ?? '—' }}</span>
                <select v-else ref="inputRef" v-model="editingValue"
                  @change="commitEdit" @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop>
                  <option v-for="a in apartments" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>

              <!-- Client (read-only, clickable) -->
              <div class="detail-field detail-field--readonly detail-field--client">
                <span class="detail-field__label">Client</span>
                <button class="detail-field__client-btn" @click="client && emit('openClient', client)">
                  {{ client?.name ?? '—' }}
                </button>
              </div>

              <!-- Channel -->
              <div
                :class="['detail-field', editingField === 'channelId' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('channelId')"
              >
                <span class="detail-field__label">Channel</span>
                <span v-if="editingField !== 'channelId'" class="detail-field__val">{{ channel?.name ?? '—' }}</span>
                <select v-else ref="inputRef" v-model="editingValue"
                  @change="commitEdit" @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop>
                  <option v-for="c in channels" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>

              <!-- Check-in -->
              <div
                :class="['detail-field', editingField === 'fromDate' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('fromDate')"
              >
                <span class="detail-field__label">Check-in</span>
                <span v-if="editingField !== 'fromDate'" class="detail-field__val">{{ formatDate(booking.fromDate) }}</span>
                <input v-else ref="inputRef" v-model="editingValue" type="date"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Check-out -->
              <div
                :class="['detail-field', editingField === 'toDate' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('toDate')"
              >
                <span class="detail-field__label">Check-out</span>
                <span v-if="editingField !== 'toDate'" class="detail-field__val">{{ formatDate(booking.toDate) }}</span>
                <input v-else ref="inputRef" v-model="editingValue" type="date"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Paid date (editable by all) -->
              <div
                :class="['detail-field', editingField === 'paidDate' && 'detail-field--editing']"
                @click="startEdit('paidDate')"
              >
                <span class="detail-field__label">Paid date</span>
                <span v-if="editingField !== 'paidDate'" class="detail-field__val">
                  {{ booking.paidDate ? formatDate(booking.paidDate) : '—' }}
                </span>
                <input v-else ref="inputRef" v-model="editingValue" type="date"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Adults -->
              <div
                :class="['detail-field', editingField === 'adultCount' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('adultCount')"
              >
                <span class="detail-field__label">Adults</span>
                <span v-if="editingField !== 'adultCount'" class="detail-field__val">{{ booking.adultCount }}</span>
                <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Children -->
              <div
                :class="['detail-field', editingField === 'childrenCount' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('childrenCount')"
              >
                <span class="detail-field__label">Children</span>
                <span v-if="editingField !== 'childrenCount'" class="detail-field__val">{{ booking.childrenCount }}</span>
                <input v-else ref="inputRef" v-model="editingValue" type="number" min="0"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Amount -->
              <div
                :class="['detail-field', editingField === 'totalAmountDue' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
                @click="isAdmin && startEdit('totalAmountDue')"
              >
                <span class="detail-field__label">Amount (€)</span>
                <span v-if="editingField !== 'totalAmountDue'" class="detail-field__val">{{ booking.totalAmountDue.toFixed(2) }}</span>
                <input v-else ref="inputRef" v-model="editingValue" type="number" min="0" step="0.01"
                  @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

              <!-- Comment (editable by all, full width) -->
              <div
                :class="['detail-field', 'detail-field--wide', editingField === 'comment' && 'detail-field--editing']"
                @click="startEdit('comment')"
              >
                <span class="detail-field__label">Comment</span>
                <span v-if="editingField !== 'comment'" class="detail-field__val detail-field__val--pre">{{ booking.comment || '—' }}</span>
                <textarea v-else ref="inputRef" v-model="editingValue" rows="2" placeholder="Comment"
                  @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
              </div>

            </div>
          </div>

        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
/* ── Expand cell ───────────────────────────────────────────── */

.expand-cell {
  width: 4rem;
  padding-left: 0 !important;
  text-align: right;
  white-space: nowrap;
}

.status-icon {
  color: var(--text-muted);
  margin-right: 0.25rem;
  vertical-align: middle;
}

.booking-row--expanded td {
  background: rgba(37, 99, 235, 0.03);
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

/* ── Panel structure ────────────────────────────────────────── */

.details-panel {
  position: relative;
  padding: 0.875rem 0.875rem 0.75rem;
  background: var(--bg);
  border-left: 3px solid var(--accent);
}

.delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.3rem;
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
  grid-template-columns: repeat(3, 1fr);
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

.detail-field--readonly {
  cursor: default;
}

.detail-field--readonly:hover {
  background: transparent;
  border-color: transparent;
}

.detail-field--client:hover {
  background: rgba(37, 99, 235, 0.03);
  border-color: var(--border);
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

/* ── Client button in expanded drawer ──────────────────────── */

.detail-field__client-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.8rem;
  font-family: inherit;
  text-align: left;
  display: block;
}
.detail-field__client-btn:hover { text-decoration: underline; }
</style>
