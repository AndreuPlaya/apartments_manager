<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import type { Booking, BookingStatus } from '../../api/client'
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
  patch: [changes: { comment?: string; status?: BookingStatus }]
}>()

const localComment = ref(props.booking.comment ?? '')
const localStatus = ref<BookingStatus>(props.booking.status)

watch(() => props.booking, (b) => {
  localComment.value = b.comment ?? ''
  localStatus.value = b.status
})

const commentDirty = computed(() => localComment.value !== (props.booking.comment ?? ''))

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

function setStatus(s: BookingStatus) {
  if (s === localStatus.value) return
  localStatus.value = s
  emit('patch', { status: s })
}

function saveComment() {
  emit('patch', { comment: localComment.value })
}
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
        <span class="booking-popup__amount">€{{ booking.totalAmountDue.toFixed(2) }}</span>
      </div>

      <div class="booking-popup__status-pills">
        <button
          v-for="s in (['NotPaid', 'Paid', 'Cancelled'] as BookingStatus[])"
          :key="s"
          :class="['status-pill', { 'status-pill--active': localStatus === s }]"
          @click="setStatus(s)"
        >{{ s === 'NotPaid' ? 'Not paid' : s }}</button>
      </div>

      <div class="booking-popup__comment-field">
        <textarea
          v-model="localComment"
          class="booking-popup__comment-input"
          placeholder="Add a comment…"
          rows="2"
        />
        <button
          v-if="commentDirty"
          class="btn btn--primary btn--sm booking-popup__comment-save"
          @click="saveComment"
        >Save</button>
      </div>

      <div v-if="isAdmin" class="booking-popup__actions">
        <button class="btn btn--ghost btn--sm" @click="emit('edit')">Edit</button>
        <button class="btn btn--ghost btn--sm text-danger" @click="emit('delete')">Delete</button>
      </div>
    </div>
  </Teleport>
</template>
