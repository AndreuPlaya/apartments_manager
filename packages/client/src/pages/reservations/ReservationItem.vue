<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, ReservationStatus, Listing, Guest, Channel } from '../../api/client'
import { useConfirm } from '../../composables/useConfirm'
import BaseItem from '../../shared/BaseItem.vue'
import AppIcon from '../../shared/AppIcon.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CurrencyInput from '../../shared/fields/CurrencyInput.vue'
import DateInput from '../../shared/fields/DateInput.vue'
import SelectInput from '../../shared/fields/SelectInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'
import {
  allowedTransitions,
  holdsDates,
  statusIconName,
  statusLabelKey,
  statusModifier,
  transitionLabelKey,
} from '../../shared/reservationStatus'

const { t } = useI18n()

const props = defineProps<{
  reservation: Reservation
  listings: Listing[]
  guests: Guest[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  transition: [id: string, status: ReservationStatus]
  delete: [reservation: Reservation]
  openGuest: [guest: Guest]
}>()

const { confirm } = useConfirm()

const guest = computed(() => props.guests.find(c => c.id === props.reservation.guestId))
const listing = computed(() => props.listings.find(a => a.id === props.reservation.listingId))

const isArriving = computed(() => props.reservation.checkIn === props.today && holdsDates(props.reservation.status))
const isDeparting = computed(() => props.reservation.checkOut === props.today && holdsDates(props.reservation.status))
const isStaying = computed(() => props.reservation.checkIn < props.today && props.reservation.checkOut > props.today && holdsDates(props.reservation.status))

const statusIcon = computed(() => {
  if (isArriving.value) return 'log-in'
  if (isDeparting.value) return 'log-out'
  if (isStaying.value) return 'home'
  return null
})

// Only the transitions the lifecycle allows are offered, so the desk cannot
// pick a move the server would refuse (docs/UX.md §3).
const transitions = computed(() => allowedTransitions(props.reservation.status))

const daysUntilArrival = computed(() => {
  const from = new Date(props.reservation.checkIn + 'T00:00:00')
  const tod  = new Date(props.today + 'T00:00:00')
  return Math.round((from.getTime() - tod.getTime()) / 86400000)
})

const isUpcoming = computed(() =>
  holdsDates(props.reservation.status) &&
  daysUntilArrival.value > 0 &&
  daysUntilArrival.value <= 15
)

const guestString = computed(() => {
  const adults = props.reservation.adultCount
  const children = props.reservation.childrenCount
  return children > 0 ? `${adults} + (${children})` : String(adults)
})

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const listingOptions = computed(() =>
  props.listings.map(a => ({ value: a.id, label: a.name }))
)
const channelOptions = computed(() =>
  props.channels.map(c => ({ value: c.id, label: c.name }))
)

function updateAdminField(field: keyof Reservation, val: string | number | boolean) {
  emit('update', props.reservation.id, {
    listingId: props.reservation.listingId,
    guestId: props.reservation.guestId,
    channelId: props.reservation.channelId,
    checkIn: props.reservation.checkIn,
    checkOut: props.reservation.checkOut,
    adultCount: props.reservation.adultCount,
    childrenCount: props.reservation.childrenCount,
    status: props.reservation.status,
    paidDate: props.reservation.paidDate,
    totalAmountDue: props.reservation.totalAmountDue,
    comment: props.reservation.comment,
    cribRequested: props.reservation.cribRequested,
    [field]: val,
  })
}

async function handleDelete() {
  const aptName = listing.value?.name ?? '—'
  const guestName = guest.value?.name ?? '—'
  const dates = `${formatDate(props.reservation.checkIn)} → ${formatDate(props.reservation.checkOut)}`
  const ok = await confirm(t('reservations.deleteConfirm', { listing: aptName, guest: guestName, dates }))
  if (ok) emit('delete', props.reservation)
}
</script>

<template>
  <BaseItem
    :col-span="8"
    :loading="loading"
    :can-delete="isAdmin"
    :class="{
      'row--arriving': isArriving,
      'row--staying': isStaying,
    }"
    @delete="handleDelete"
  >
    <template #summary>
      <td>{{ listing?.name ?? '—' }}</td>
      <td class="info-cell">
        <AppIcon
          v-if="reservation.comment"
          name="info-circle"
          :size="13"
          class="info-icon"
        />
      </td>
      <td>{{ guest?.name ?? '—' }}</td>
      <td>{{ formatDate(reservation.checkIn) }}</td>
      <td>{{ formatDate(reservation.checkOut) }}</td>
      <td class="guests-cell">
        {{ guestString }}
        <AppIcon
          v-if="reservation.cribRequested && reservation.childrenCount > 0"
          name="crib"
          :size="14"
          class="crib-icon"
        />
      </td>
      <td class="status-cell">
        <span class="badge" :class="statusModifier(reservation.status)">
          <AppIcon :name="statusIconName(reservation.status)" :size="12" />
          {{ t(statusLabelKey(reservation.status)) }}
        </span>
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
        <span class="panel-label">{{ t('reservations.reservationDetails') }}</span>
        <div class="details-grid details-grid--3col">

          <!-- Row 1: listing | guest | channel -->
          <SelectInput
            :text="t('reservations.listing')"
            :model-value="reservation.listingId"
            :options="listingOptions"
            :rights="isAdmin"
            @update:model-value="updateAdminField('listingId', $event)"
          />

          <div class="detail-field detail-field--readonly detail-field--guest">
            <span class="detail-field__label">{{ t('reservations.guest') }}</span>
            <button class="detail-field__guest-btn" @click.stop="guest && emit('openGuest', guest)">
              {{ guest?.name ?? '—' }}
            </button>
          </div>

          <SelectInput
            :text="t('reservations.channel')"
            :model-value="reservation.channelId"
            :options="channelOptions"
            :rights="isAdmin"
            @update:model-value="updateAdminField('channelId', $event)"
          />

          <!-- Row 2: checkin | checkout | [gap] -->
          <DateInput
            :text="t('reservations.checkin')"
            :model-value="reservation.checkIn"
            :rights="isAdmin"
            @update:model-value="updateAdminField('checkIn', $event)"
          />

          <DateInput
            :text="t('reservations.checkout')"
            :model-value="reservation.checkOut"
            :rights="isAdmin"
            @update:model-value="updateAdminField('checkOut', $event)"
          />

          <div aria-hidden="true" />

          <!-- Row 3: adults | children | crib (space reserved) -->
          <NumberInput
            :text="t('reservations.adults')"
            :model-value="reservation.adultCount"
            :min="1"
            :rights="isAdmin"
            @update:model-value="updateAdminField('adultCount', $event)"
          />

          <NumberInput
            :text="t('reservations.children')"
            :model-value="reservation.childrenCount"
            :min="0"
            :rights="isAdmin"
            @update:model-value="updateAdminField('childrenCount', $event)"
          />

          <div class="reservation-crib-cell">
            <CheckboxInput
              v-if="isAdmin && reservation.childrenCount > 0"
              :text="t('reservations.crib')"
              :model-value="!!reservation.cribRequested"
              :rights="isAdmin"
              @update:model-value="updateAdminField('cribRequested', $event)"
            />
          </div>
          
          <!-- Row 4: total amount | paid date | [gap] -->
          <CurrencyInput
            :text="t('reservations.amount')"
            :model-value="reservation.totalAmountDue"
            :rights="isAdmin"
            @update:model-value="updateAdminField('totalAmountDue', $event)"
          />

          <DateInput
            :text="t('reservations.paidDate')"
            :model-value="reservation.paidDate ?? ''"
            @update:model-value="emit('patch', reservation.id, { paidDate: $event || undefined })"
          />

          <div aria-hidden="true" />

          <!-- Row 5: comment (full width) -->
          <TextareaInput
            class="detail-field--wide"
            :text="t('reservations.comment')"
            :model-value="reservation.comment ?? ''"
            @update:model-value="emit('patch', reservation.id, { comment: $event || undefined })"
          />

          <!-- Row 6: lifecycle actions (full width) -->
          <div class="detail-field detail-field--wide reservation-transitions">
            <span class="detail-field__label">{{ t('reservations.statusLabel') }}</span>
            <div class="reservation-transitions__actions">
              <button
                v-for="next in transitions"
                :key="next"
                class="btn btn--sm"
                :class="next === 'Cancelled' || next === 'NoShow' ? 'btn--ghost' : 'btn--primary'"
                :disabled="loading"
                @click.stop="emit('transition', reservation.id, next)"
              >
                <AppIcon :name="statusIconName(next)" :size="13" />
                {{ t(transitionLabelKey(next)) }}
              </button>
              <span v-if="transitions.length === 0" class="reservation-transitions__final">
                {{ t('reservations.statusFinal') }}
              </span>
            </div>
          </div>

        </div>
      </div>
    </template>
  </BaseItem>
</template>
