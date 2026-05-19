<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import BookingInfoPopup from './BookingInfoPopup.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps<{
  bookings: Booking[]
  apartments: Apartment[]
  clients: Client[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [booking: Booking]
  delete: [booking: Booking]
  update: [id: string, changes: { fromDate?: string; toDate?: string }]
}>()

// ── Month navigation ──────────────────────────────────────────────────────────

const now = new Date()
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth())

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

const todayFlash = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null

function goToday() {
  const t = new Date()
  calYear.value = t.getFullYear()
  calMonth.value = t.getMonth()
  if (flashTimer !== null) clearTimeout(flashTimer)
  todayFlash.value = false
  requestAnimationFrame(() => {
    todayFlash.value = true
    flashTimer = setTimeout(() => { todayFlash.value = false }, 800)
  })
}

const monthLabel = computed(() =>
  new Date(calYear.value, calMonth.value, 1).toLocaleDateString(undefined, {
    month: 'long', year: 'numeric',
  })
)

// ── Filter / mode ─────────────────────────────────────────────────────────────

const filterApt = ref('')
const filterMode = ref<'bookings' | 'free'>('bookings')

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
]

const sortedApartments = computed(() =>
  [...props.apartments].sort((a, b) => a.name.localeCompare(b.name))
)

function aptColor(aptId: string): string {
  const idx = sortedApartments.value.findIndex((a) => a.id === aptId)
  return COLORS[idx % COLORS.length] ?? COLORS[0]!
}

const visibleApartments = computed(() =>
  filterApt.value
    ? sortedApartments.value.filter((a) => a.id === filterApt.value)
    : sortedApartments.value
)

// ── Calendar grid ─────────────────────────────────────────────────────────────

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayCell {
  date: string
  day: number
  outsideMonth: boolean
}

const calDays = computed<DayCell[]>(() => {
  const firstOfMonth = new Date(calYear.value, calMonth.value, 1)
  const dowOffset = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const cells: DayCell[] = []

  for (let i = dowOffset - 1; i >= 0; i--) {
    const d = new Date(calYear.value, calMonth.value, -i)
    cells.push({ date: toISO(d), day: d.getDate(), outsideMonth: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: toISO(new Date(calYear.value, calMonth.value, d)),
      day: d,
      outsideMonth: false,
    })
  }
  const trailing = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(calYear.value, calMonth.value + 1, i)
    cells.push({ date: toISO(d), day: d.getDate(), outsideMonth: true })
  }
  return cells
})

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}


const todayISO = toISO(new Date())

// ── Drag state ────────────────────────────────────────────────────────────────

interface DragState {
  bookingId: string
  edge: 'start' | 'end'
  currentDate: string
  canDrop: boolean
}

const dragState = ref<DragState | null>(null)
const calendarRef = ref<HTMLElement | null>(null)

// ── Effective bookings (preview during drag) ──────────────────────────────────

const effectiveBookings = computed(() => {
  if (!dragState.value || !dragState.value.canDrop) return props.bookings
  return props.bookings.map((b) => {
    if (b.id !== dragState.value!.bookingId) return b
    if (dragState.value!.edge === 'start')
      return { ...b, fromDate: dragState.value!.currentDate }
    return { ...b, toDate: dragState.value!.currentDate }
  })
})

// ── Segments ──────────────────────────────────────────────────────────────────

interface Segment {
  booking: Booking | null
  apt: Apartment
  aptIndex: number
  startCol: number
  endCol: number
  isStart: boolean
  isEnd: boolean
  label: string
}

interface Week {
  days: DayCell[]
  segments: Segment[]
}

function computeSegmentsForWeek(weekDays: DayCell[]): Segment[] {
  const weekStart = weekDays[0].date
  const weekEnd = weekDays[6].date
  const segments: Segment[] = []

  visibleApartments.value.forEach((apt, aptIndex) => {
    if (filterMode.value === 'free') {
      segments.push(...computeFreeSegments(weekDays, apt, aptIndex))
      return
    }

    const aptBookings = effectiveBookings.value.filter(
      (b) =>
        b.apartmentId === apt.id &&
        b.status !== 'Cancelled' &&
        b.fromDate <= weekEnd &&
        b.toDate >= weekStart,
    )

    for (const booking of aptBookings) {
      const segStart = booking.fromDate >= weekStart ? booking.fromDate : weekStart
      const segEnd = booking.toDate <= weekEnd ? booking.toDate : weekEnd

      const startCol = weekDays.findIndex((d) => d.date === segStart) + 1
      const endCol = weekDays.findIndex((d) => d.date === segEnd) + 1
      if (startCol < 1 || endCol < 1) continue

      segments.push({
        booking,
        apt,
        aptIndex,
        startCol,
        endCol,
        isStart: booking.fromDate === segStart,
        isEnd: booking.toDate === segEnd,
        label: clientName(booking.clientId),
      })
    }
  })

  return segments
}

function computeFreeSegments(weekDays: DayCell[], apt: Apartment, aptIndex: number): Segment[] {
  const segments: Segment[] = []
  const aptBookings = props.bookings.filter(
    (b) => b.apartmentId === apt.id && b.status !== 'Cancelled',
  )

  const freeFlags = weekDays.map(
    (d) => !aptBookings.some((b) => b.fromDate <= d.date && b.toDate > d.date),
  )

  let runStart: number | null = null
  for (let i = 0; i <= weekDays.length; i++) {
    const isFree = i < weekDays.length && freeFlags[i]
    if (isFree && runStart === null) {
      runStart = i
    } else if (!isFree && runStart !== null) {
      segments.push({
        booking: null,
        apt,
        aptIndex,
        startCol: runStart + 1,
        endCol: i,
        isStart: true,
        isEnd: true,
        label: '',
      })
      runStart = null
    }
  }

  return segments
}

const calWeeks = computed<Week[]>(() =>
  Array.from({ length: calDays.value.length / 7 }, (_, i) => {
    const days = calDays.value.slice(i * 7, i * 7 + 7)
    return { days, segments: computeSegmentsForWeek(days) }
  }),
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function clientName(clientId: string): string {
  return props.clients.find((c) => c.id === clientId)?.name ?? '—'
}
function aptName(aptId: string): string {
  return props.apartments.find((a) => a.id === aptId)?.name ?? '—'
}
function channelName(channelId: string): string {
  return props.channels.find((c) => c.id === channelId)?.name ?? '—'
}

// ── Hover highlight ───────────────────────────────────────────────────────────

const hoveredBookingId = ref<string | null>(null)

// ── Drag to resize ────────────────────────────────────────────────────────────

function getDateFromPoint(x: number, y: number): string | null {
  if (!calendarRef.value) return null
  const weekEls = calendarRef.value.querySelectorAll<HTMLElement>('.cal-week')
  let weekIdx = -1
  for (let i = 0; i < weekEls.length; i++) {
    const r = weekEls[i].getBoundingClientRect()
    if (y >= r.top && y <= r.bottom) { weekIdx = i; break }
  }
  if (weekIdx < 0 || weekIdx >= calWeeks.value.length) return null

  const gridRect = calendarRef.value.getBoundingClientRect()
  const col = Math.min(6, Math.max(0, Math.floor((x - gridRect.left) / (gridRect.width / 7))))
  return calWeeks.value[weekIdx].days[col]?.date ?? null
}

function isValidDrag(booking: Booking, edge: 'start' | 'end', targetDate: string): boolean {
  const apt = props.apartments.find((a) => a.id === booking.apartmentId)
  const newFrom = edge === 'start' ? targetDate : booking.fromDate
  const newToExclusive = edge === 'end' ? targetDate : booking.toDate

  if (newFrom >= newToExclusive) return false

  const nights = (Date.parse(newToExclusive) - Date.parse(newFrom)) / 86400000
  if (apt && nights < apt.minNights) return false

  return !props.bookings.some(
    (b) =>
      b.id !== booking.id &&
      b.apartmentId === booking.apartmentId &&
      b.status !== 'Cancelled' &&
      b.fromDate < newToExclusive &&
      b.toDate > newFrom,
  )
}

function startDrag(booking: Booking, edge: 'start' | 'end') {
  if (!props.isAdmin) return
  const initialDate =
    edge === 'start'
      ? booking.fromDate
      : booking.toDate

  dragState.value = { bookingId: booking.id, edge, currentDate: initialDate, canDrop: true }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragState.value) return
  const targetDate = getDateFromPoint(e.clientX, e.clientY)
  if (!targetDate) return
  const booking = props.bookings.find((b) => b.id === dragState.value!.bookingId)
  if (!booking) return
  const canDrop = isValidDrag(booking, dragState.value.edge, targetDate)
  dragState.value = { ...dragState.value, currentDate: targetDate, canDrop }
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  dragEndedRecently = true
  requestAnimationFrame(() => { dragEndedRecently = false })
  if (!dragState.value) return
  const ds = dragState.value
  dragState.value = null
  if (!ds.canDrop) return
  const booking = props.bookings.find((b) => b.id === ds.bookingId)
  if (!booking) return
  const changes =
    ds.edge === 'start'
      ? { fromDate: ds.currentDate }
      : { toDate: ds.currentDate }
  emit('update', ds.bookingId, changes)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  if (flashTimer !== null) clearTimeout(flashTimer)
})

// ── Popup ─────────────────────────────────────────────────────────────────────

let dragEndedRecently = false

function handleBlockClick(booking: Booking, event: MouseEvent) {
  if (dragEndedRecently) { dragEndedRecently = false; return }
  openPopup(booking, event)
}

const popupBooking = ref<Booking | null>(null)
const popupPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

function openPopup(booking: Booking, event: MouseEvent) {
  popupBooking.value = booking
  popupPos.value = { x: event.clientX, y: event.clientY }
}
function closePopup() { popupBooking.value = null }
function onEdit(b: Booking) { closePopup(); emit('edit', b) }
function onDelete(b: Booking) { closePopup(); emit('delete', b) }
</script>

<template>
  <div class="booking-calendar" ref="calendarRef">

    <!-- Month navigation -->
    <div class="booking-calendar__nav">
      <button class="btn btn--ghost btn--sm" @click="prevMonth"><AppIcon name="chevron-left" /></button>
      <span class="booking-calendar__month-label">{{ monthLabel }}</span>
      <button class="btn btn--ghost btn--sm" @click="goToday">Today</button>
      <button class="btn btn--ghost btn--sm" @click="nextMonth"><AppIcon name="chevron-right" /></button>
    </div>

    <!-- Legend -->
    <div class="booking-calendar__legend">
      <button
        :class="['legend-item', { active: filterMode === 'bookings' && filterApt === '' }]"
        @click="filterMode = 'bookings'; filterApt = ''"
      >All apartments</button>
      <button
        :class="['legend-item', { active: filterMode === 'free' }]"
        @click="filterMode = 'free'; filterApt = ''"
      >Free apartments</button>
      <button
        v-for="apt in sortedApartments"
        :key="apt.id"
        :class="['legend-item', { active: filterApt === apt.id }]"
        @click="filterMode = 'bookings'; filterApt = filterApt === apt.id ? '' : apt.id"
      >
        <span class="legend-item__dot" :style="{ background: aptColor(apt.id) }" />
        {{ apt.name }}
      </button>
    </div>

    <div v-if="loading" class="empty-state"><p>Loading…</p></div>

    <template v-else>
      <!-- DOW header -->
      <div class="cal-header">
        <div v-for="d in DOW_LABELS" :key="d" class="cal-dow">{{ d }}</div>
      </div>

      <!-- Weeks -->
      <div class="cal-week" v-for="(week, wi) in calWeeks" :key="wi">
        <!-- Day numbers row -->
        <div class="cal-week__days">
          <div
            v-for="d in week.days"
            :key="d.date"
            class="cal-day"
            :class="{
              'cal-day--today': d.date === todayISO,
              'cal-day--outside': d.outsideMonth,
              'cal-day--today-flash': d.date === todayISO && todayFlash,
            }"
          >{{ d.day }}</div>
        </div>

        <!-- One booking band per visible apartment -->
        <div
          class="cal-band"
          v-for="(apt, ai) in visibleApartments"
          :key="apt.id"
        >
          <div
            v-for="seg in week.segments.filter(s => s.aptIndex === ai)"
            :key="seg.booking?.id ?? `free-${wi}-${ai}-${seg.startCol}`"
            class="booking-block"
            :class="{
              'booking-block--start': seg.isStart,
              'booking-block--end': seg.isEnd,
              'booking-block--highlighted': hoveredBookingId !== null && hoveredBookingId === seg.booking?.id,
              'booking-block--no-drop': dragState !== null && dragState.bookingId === seg.booking?.id && !dragState.canDrop,
              'booking-block--free': seg.booking === null,
            }"
            :style="{
              gridColumnStart: seg.startCol,
              gridColumnEnd: seg.endCol + 1,
              '--apt-color': aptColor(apt.id),
            }"
          >
            <div
              class="booking-block__surface"
              @mouseenter="seg.booking ? (hoveredBookingId = seg.booking.id) : undefined"
              @mouseleave="hoveredBookingId = null"
              @click.stop="seg.booking ? handleBlockClick(seg.booking, $event) : undefined"
            >
              <div
                v-if="seg.isStart && seg.booking && isAdmin"
                class="booking-block__handle booking-block__handle--left"
                @mousedown.prevent.stop="startDrag(seg.booking, 'start')"
              />
              <span class="booking-block__label">{{ seg.label }}</span>
              <div
                v-if="seg.isEnd && seg.booking && isAdmin"
                class="booking-block__handle booking-block__handle--right"
                @mousedown.prevent.stop="startDrag(seg.booking, 'end')"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>

  <BookingInfoPopup
    v-if="popupBooking"
    :booking="popupBooking"
    :apt-name="aptName(popupBooking.apartmentId)"
    :client-name="clientName(popupBooking.clientId)"
    :channel-name="channelName(popupBooking.channelId)"
    :is-admin="isAdmin"
    :pos="popupPos"
    @close="closePopup"
    @edit="onEdit(popupBooking)"
    @delete="onDelete(popupBooking)"
  />
</template>
