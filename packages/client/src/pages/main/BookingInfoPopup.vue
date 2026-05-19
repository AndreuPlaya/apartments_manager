<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { Booking } from '../../api/client'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps<{
  booking: Booking
  aptName: string
  clientName: string
  channelName: string
  isAdmin: boolean
  pos: { x: number; y: number }
}>()

const emit = defineEmits<{
  close: []
  edit: []
  delete: []
}>()

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function nights(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
}

const popupStyle = computed(() => ({
  left: Math.min(props.pos.x + 12, window.innerWidth - 320) + 'px',
  top: Math.min(props.pos.y + 12, window.innerHeight - 400) + 'px',
}))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="booking-popup-overlay" @click="emit('close')" />

    <div
      class="booking-popup"
      :style="popupStyle"
      @click.stop
    >
      <button class="booking-popup__close" @click="emit('close')"><AppIcon name="x" :size="14" /></button>

      <div class="booking-popup__client">{{ clientName }}</div>
      <div class="booking-popup__sub">{{ aptName }} · {{ channelName }}</div>

      <div class="booking-popup__dates">
        <div class="booking-popup__date-block">
          <div class="booking-popup__date-label">Check-in</div>
          <div class="booking-popup__date-value">{{ formatDate(booking.fromDate) }}</div>
        </div>
        <div class="booking-popup__date-sep"><AppIcon name="arrow-right" :size="14" /></div>
        <div class="booking-popup__date-block">
          <div class="booking-popup__date-label">Check-out</div>
          <div class="booking-popup__date-value">{{ formatDate(booking.toDate) }}</div>
        </div>
      </div>

      <div class="booking-popup__stats">
        <div class="booking-popup__stat">
          <div class="booking-popup__stat-value">{{ nights(booking.fromDate, booking.toDate) }}</div>
          <div class="booking-popup__stat-label">nights</div>
        </div>
        <div class="booking-popup__stat">
          <div class="booking-popup__stat-value">{{ booking.adultCount }}</div>
          <div class="booking-popup__stat-label">adults</div>
        </div>
        <div class="booking-popup__stat">
          <div class="booking-popup__stat-value">{{ booking.childrenCount }}</div>
          <div class="booking-popup__stat-label">children</div>
        </div>
      </div>

      <div class="booking-popup__row">
        <span
          :class="['badge', booking.status === 'Paid' ? 'badge--paid' : booking.status === 'NotPaid' ? 'badge--notpaid' : 'badge--cancelled']"
        >{{ booking.status === 'NotPaid' ? 'Not paid' : booking.status }}</span>
        <span class="booking-popup__amount">€{{ booking.totalAmountDue.toFixed(2) }}</span>
      </div>

      <div v-if="booking.comment" class="booking-popup__comment">
        {{ booking.comment }}
      </div>

      <div v-if="isAdmin" class="booking-popup__actions">
        <button class="btn btn--ghost btn--sm" @click="emit('edit')">Edit</button>
        <button class="btn btn--ghost btn--sm text-danger" @click="emit('delete')">Delete</button>
      </div>
    </div>
  </Teleport>
</template>
