<script setup lang="ts">
import { computed } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import { useConfirm } from '../../composables/useConfirm'
import BaseItem from '../../shared/BaseItem.vue'
import AppIcon from '../../shared/AppIcon.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import DateInput from '../../shared/fields/DateInput.vue'
import SelectInput from '../../shared/fields/SelectInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

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

const client = computed(() => props.clients.find(c => c.id === props.booking.clientId))
const apartment = computed(() => props.apartments.find(a => a.id === props.booking.apartmentId))

const isArriving = computed(() => props.booking.fromDate === props.today && props.booking.status !== 'Cancelled')
const isDeparting = computed(() => props.booking.toDate === props.today && props.booking.status !== 'Cancelled')
const isStaying = computed(() => props.booking.fromDate < props.today && props.booking.toDate > props.today && props.booking.status !== 'Cancelled')

const statusIcon = computed(() => {
  if (isArriving.value) return 'log-in'
  if (isDeparting.value) return 'log-out'
  if (isStaying.value) return 'home'
  return null
})

const daysUntilArrival = computed(() => {
  const from = new Date(props.booking.fromDate + 'T00:00:00')
  const tod  = new Date(props.today + 'T00:00:00')
  return Math.round((from.getTime() - tod.getTime()) / 86400000)
})

const isUpcoming = computed(() =>
  props.booking.status !== 'Cancelled' &&
  daysUntilArrival.value > 0 &&
  daysUntilArrival.value <= 7
)

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

const apartmentOptions = computed(() =>
  props.apartments.map(a => ({ value: a.id, label: a.name }))
)
const channelOptions = computed(() =>
  props.channels.map(c => ({ value: c.id, label: c.name }))
)
const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Cancelled', label: 'Cancelled' },
]

function updateAdminField(field: keyof Booking, val: string | number | boolean) {
  emit('update', props.booking.id, {
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
    cribRequested: props.booking.cribRequested,
    [field]: val,
  })
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
    :col-span="7"
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
        {{ guestString }}
        <AppIcon
          v-if="booking.cribRequested && booking.childrenCount > 0"
          name="crib"
          :size="14"
          class="crib-icon"
        />
      </td>
      <td class="status-cell">
        <template v-if="isArriving || isDeparting || isStaying">
          <AppIcon :name="(statusIcon as string)" :size="14" class="status-icon" />
        </template>
        <template v-else-if="isUpcoming">
          <AppIcon name="log-in" :size="14" class="status-icon status-icon--upcoming" />
          <span class="day-badge">{{ daysUntilArrival }}d</span>
        </template>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">Booking details</span>
        <div class="details-grid details-grid--3col">

          <SelectInput
            text="Apartment"
            :model-value="booking.apartmentId"
            :options="apartmentOptions"
            :rights="isAdmin"
            @update:model-value="updateAdminField('apartmentId', $event)"
          />

          <!-- Client (read-only, clickable) -->
          <div class="detail-field detail-field--readonly detail-field--client">
            <span class="detail-field__label">Client</span>
            <button class="detail-field__client-btn" @click.stop="client && emit('openClient', client)">
              {{ client?.name ?? '—' }}
            </button>
          </div>

          <SelectInput
            text="Channel"
            :model-value="booking.channelId"
            :options="channelOptions"
            :rights="isAdmin"
            @update:model-value="updateAdminField('channelId', $event)"
          />

          <DateInput
            text="Check-in"
            :model-value="booking.fromDate"
            :rights="isAdmin"
            @update:model-value="updateAdminField('fromDate', $event)"
          />

          <DateInput
            text="Check-out"
            :model-value="booking.toDate"
            :rights="isAdmin"
            @update:model-value="updateAdminField('toDate', $event)"
          />

          <DateInput
            text="Paid date"
            :model-value="booking.paidDate ?? ''"
            @update:model-value="emit('patch', booking.id, { paidDate: $event || undefined })"
          />

          <NumberInput
            text="Adults"
            :model-value="booking.adultCount"
            :min="1"
            :rights="isAdmin"
            @update:model-value="updateAdminField('adultCount', $event)"
          />

          <NumberInput
            text="Children"
            :model-value="booking.childrenCount"
            :min="0"
            :rights="isAdmin"
            @update:model-value="updateAdminField('childrenCount', $event)"
          />

          <CheckboxInput
            v-if="isAdmin && booking.childrenCount > 0"
            text="Crib"
            :model-value="!!booking.cribRequested"
            :rights="isAdmin"
            @update:model-value="updateAdminField('cribRequested', $event)"
          />

          <NumberInput
            text="Amount (€)"
            :model-value="booking.totalAmountDue"
            :min="0"
            :step="0.01"
            :display-fn="v => v.toFixed(2)"
            :rights="isAdmin"
            @update:model-value="updateAdminField('totalAmountDue', $event)"
          />

          <SelectInput
            text="Status"
            :model-value="booking.status"
            :options="statusOptions"
            :rights="isAdmin"
            @update:model-value="updateAdminField('status', $event)"
          />

          <TextareaInput
            text="Comment"
            :model-value="booking.comment ?? ''"
            @update:model-value="emit('patch', booking.id, { comment: $event || undefined })"
          />

        </div>
      </div>
    </template>
  </BaseItem>
</template>

<style scoped>
.guests-cell {
  white-space: nowrap;
}

.crib-icon {
  color: var(--text-muted);
  vertical-align: middle;
  margin-left: 0.25rem;
}

.status-cell {
  width: 2rem;
  white-space: nowrap;
  text-align: center;
}

.status-icon {
  color: var(--text-muted);
  vertical-align: middle;
}

.day-badge {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-left: 0.15rem;
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
