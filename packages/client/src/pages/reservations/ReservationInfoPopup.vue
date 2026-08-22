<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, ReservationStatus } from '../../api/client'
import AppIcon from '../../shared/AppIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  reservation: Reservation
  aptName: string
  guestName: string
  channelName: string
  pos: { x: number; y: number }
}>()

const emit = defineEmits<{
  close: []
  patch: [changes: { comment?: string; status?: ReservationStatus; paidDate?: string }]
}>()

const localComment = ref(props.reservation.comment ?? '')
const localPaidDate = ref(props.reservation.paidDate ?? '')
watch(() => props.reservation, (b) => {
  localComment.value = b.comment ?? ''
  localPaidDate.value = b.paidDate ?? ''
})

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function nights(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
}

// En pantallas estrechas el clamp superior deja el popup fuera de la ventana,
// así que se acota también por abajo con un margen de 8px.
const popupStyle = computed(() => ({
  left: Math.max(8, Math.min(props.pos.x + 12, window.innerWidth - 320)) + 'px',
  top: Math.max(8, Math.min(props.pos.y + 12, window.innerHeight - 400)) + 'px',
}))

function handleClose() {
  const changes: { comment?: string; paidDate?: string } = {}
  if (localComment.value !== (props.reservation.comment ?? '')) changes.comment = localComment.value
  if (localPaidDate.value !== (props.reservation.paidDate ?? '')) changes.paidDate = localPaidDate.value
  if (Object.keys(changes).length > 0) emit('patch', changes)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

</script>

<template>
  <Teleport to="body">
    <div class="reservation-popup-overlay" @click="handleClose" />

    <div
      class="reservation-popup"
      :style="popupStyle"
      @click.stop
    >
      <button class="reservation-popup__close" @click="handleClose"><AppIcon name="x" :size="14" /></button>

      <div class="reservation-popup__guest">{{ guestName }}</div>
      <div class="reservation-popup__sub">{{ aptName }} · {{ channelName }}</div>

      <div class="reservation-popup__dates">
        <div class="reservation-popup__date-block">
          <div class="reservation-popup__date-label">{{ t('reservations.checkin') }}</div>
          <div class="reservation-popup__date-value">{{ formatDate(reservation.checkIn) }}</div>
        </div>
        <div class="reservation-popup__date-sep"><AppIcon name="arrow-right" :size="14" /></div>
        <div class="reservation-popup__date-block">
          <div class="reservation-popup__date-label">{{ t('reservations.checkout') }}</div>
          <div class="reservation-popup__date-value">{{ formatDate(reservation.checkOut) }}</div>
        </div>
      </div>

      <div class="reservation-popup__stats">
        <div class="reservation-popup__stat">
          <div class="reservation-popup__stat-value">{{ nights(reservation.checkIn, reservation.checkOut) }}</div>
          <div class="reservation-popup__stat-label">{{ t('reservations.nights') }}</div>
        </div>
        <div class="reservation-popup__stat">
          <div class="reservation-popup__stat-value">{{ reservation.adultCount }}</div>
          <div class="reservation-popup__stat-label">{{ t('reservations.adultsLabel') }}</div>
        </div>
        <div class="reservation-popup__stat">
          <div class="reservation-popup__stat-value">{{ reservation.childrenCount }}</div>
          <div class="reservation-popup__stat-label">{{ t('reservations.childrenLabel') }}</div>
        </div>
      </div>

      <div class="reservation-popup__row">
        <span class="reservation-popup__amount">€{{ reservation.totalAmountDue.toFixed(2) }}</span>
      </div>

      <div class="reservation-popup__field">
        <label class="reservation-popup__field-label">{{ t('reservations.paidDate') }}</label>
        <input
          v-model="localPaidDate"
          type="date"
          class="reservation-popup__paid-date"
        />
      </div>

      <div class="reservation-popup__comment-field">
        <textarea
          v-model="localComment"
          class="reservation-popup__comment-input"
          :placeholder="t('reservations.addComment')"
          rows="2"
        />
      </div>

    </div>
  </Teleport>
</template>
