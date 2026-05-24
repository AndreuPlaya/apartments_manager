<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import { useConfirm } from '../../composables/useConfirm'
import BaseItem from '../../shared/BaseItem.vue'
import AppIcon from '../../shared/AppIcon.vue'

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

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)
const { editingField, editingValue, startEdit, cancelEdit } = useInlineEdit<keyof Booking>(inputRef)

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

async function handleCancel() {
  const aptName = apartment.value?.name ?? '—'
  const clientName = client.value?.name ?? '—'
  const dates = `${formatDate(props.booking.fromDate)} → ${formatDate(props.booking.toDate)}`
  const ok = await confirm(`Cancel booking?\n${aptName} · ${clientName}\n${dates}`)
  if (ok) emit('cancel', props.booking)
}
</script>

<template>
  <BaseItem
    :col-span="6"
    :loading="loading"
    :can-delete="isAdmin"
    :class="{
      'row--arriving': isArriving,
      'row--staying': isStaying,
    }"
    @delete="handleCancel"
  >
    <template #summary>
      <td>{{ apartment?.name ?? '—' }}</td>
      <td>{{ client?.name ?? '—' }}</td>
      <td>{{ formatDate(booking.fromDate) }}</td>
      <td>{{ formatDate(booking.toDate) }}</td>
      <td class="guests-cell">
        <AppIcon v-if="statusIcon" :name="statusIcon" :size="14" class="status-icon" />
        {{ guestString }}
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">Booking details</span>
        <div class="details-grid details-grid--3col">

          <!-- Apartment -->
          <div
            :class="['detail-field', editingField === 'apartmentId' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
            @click="isAdmin && startEdit('apartmentId', booking.apartmentId)"
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
            <button class="detail-field__client-btn" @click.stop="client && emit('openClient', client)">
              {{ client?.name ?? '—' }}
            </button>
          </div>

          <!-- Channel -->
          <div
            :class="['detail-field', editingField === 'channelId' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
            @click="isAdmin && startEdit('channelId', booking.channelId)"
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
            @click="isAdmin && startEdit('fromDate', booking.fromDate)"
          >
            <span class="detail-field__label">Check-in</span>
            <span v-if="editingField !== 'fromDate'" class="detail-field__val">{{ formatDate(booking.fromDate) }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="date"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <!-- Check-out -->
          <div
            :class="['detail-field', editingField === 'toDate' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
            @click="isAdmin && startEdit('toDate', booking.toDate)"
          >
            <span class="detail-field__label">Check-out</span>
            <span v-if="editingField !== 'toDate'" class="detail-field__val">{{ formatDate(booking.toDate) }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="date"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <!-- Paid date (editable by all) -->
          <div
            :class="['detail-field', editingField === 'paidDate' && 'detail-field--editing']"
            @click="startEdit('paidDate', booking.paidDate ?? '')"
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
            @click="isAdmin && startEdit('adultCount', booking.adultCount)"
          >
            <span class="detail-field__label">Adults</span>
            <span v-if="editingField !== 'adultCount'" class="detail-field__val">{{ booking.adultCount }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <!-- Children -->
          <div
            :class="['detail-field', editingField === 'childrenCount' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
            @click="isAdmin && startEdit('childrenCount', booking.childrenCount)"
          >
            <span class="detail-field__label">Children</span>
            <span v-if="editingField !== 'childrenCount'" class="detail-field__val">{{ booking.childrenCount }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="0"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <!-- Amount -->
          <div
            :class="['detail-field', editingField === 'totalAmountDue' && 'detail-field--editing', !isAdmin && 'detail-field--readonly']"
            @click="isAdmin && startEdit('totalAmountDue', booking.totalAmountDue)"
          >
            <span class="detail-field__label">Amount (€)</span>
            <span v-if="editingField !== 'totalAmountDue'" class="detail-field__val">{{ booking.totalAmountDue.toFixed(2) }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="0" step="0.01"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <!-- Comment (editable by all, full width) -->
          <div
            :class="['detail-field', 'detail-field--wide', editingField === 'comment' && 'detail-field--editing']"
            @click="startEdit('comment', booking.comment ?? '')"
          >
            <span class="detail-field__label">Comment</span>
            <span v-if="editingField !== 'comment'" class="detail-field__val detail-field__val--pre">{{ booking.comment || '—' }}</span>
            <textarea v-else ref="inputRef" v-model="editingValue" rows="2" placeholder="Comment"
              @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

        </div>
      </div>
    </template>
  </BaseItem>
</template>

<style scoped>
.guests-cell {
  white-space: nowrap;
}

.status-icon {
  color: var(--text-muted);
  margin-right: 0.25rem;
  vertical-align: middle;
}

.detail-field--client:hover {
  background: rgba(37, 99, 235, 0.03);
  border-color: var(--border);
}

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
