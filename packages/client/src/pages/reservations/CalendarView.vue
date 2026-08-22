<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, Listing, Guest, Channel, ReservationStatus } from '../../api/client'
import ReservationInfoPopup from './ReservationInfoPopup.vue'
import AppIcon from '../../shared/AppIcon.vue'
import { holdsDates } from '../../shared/reservationStatus'

const { t, locale } = useI18n()

const props = defineProps<{
  reservations: Reservation[]
  listings: Listing[]
  guests: Guest[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  update: [id: string, changes: { checkIn?: string; checkOut?: string }]
  patch: [id: string, changes: { comment?: string; status?: ReservationStatus; paidDate?: string }]
  'month-change': [year: number, month: number]
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

watch([calYear, calMonth], ([y, m]) => emit('month-change', y, m))

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
const filterMode = ref<'reservations' | 'free'>('reservations')

// ── Color palette ─────────────────────────────────────────────────────────────

const CALENDAR_COLOR_COUNT = 8

const sortedListings = computed(() =>
  [...props.listings].sort((a, b) => a.name.localeCompare(b.name))
)

function aptColorIndex(aptId: string): number {
  const idx = sortedListings.value.findIndex((a) => a.id === aptId)
  return idx % CALENDAR_COLOR_COUNT
}

function aptColor(aptId: string): string {
  return `var(--cal-color-${aptColorIndex(aptId)})`
}

// Texto de la banda: sobre la mostaza va en tinta, nunca en blanco (§6 de la
// identidad cromática), así que cada color lleva su pareja.
function aptOnColor(aptId: string): string {
  return `var(--cal-on-${aptColorIndex(aptId)})`
}

const visibleListings = computed(() =>
  filterApt.value
    ? sortedListings.value.filter((a) => a.id === filterApt.value)
    : sortedListings.value
)

// ── Calendar grid ─────────────────────────────────────────────────────────────

// Jan 1, 2024 is a Monday — use it as a fixed anchor to generate locale-aware short weekday names
const DOW_LABELS = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 1).toLocaleDateString(locale.value, { weekday: 'short' })
  )
)

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
  reservationId: string
  edge: 'start' | 'end'
  currentDate: string
  canDrop: boolean
}

const dragState = ref<DragState | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)

// ── Effective reservations (preview during drag) ──────────────────────────────────

const effectiveReservations = computed(() => {
  if (!dragState.value || !dragState.value.canDrop) return props.reservations
  return props.reservations.map((b) => {
    if (b.id !== dragState.value!.reservationId) return b
    if (dragState.value!.edge === 'start')
      return { ...b, checkIn: dragState.value!.currentDate }
    return { ...b, checkOut: dragState.value!.currentDate }
  })
})

// ── Segments ──────────────────────────────────────────────────────────────────

interface Segment {
  reservation: Reservation | null
  apt: Listing
  aptIndex: number
  startCol: number
  endCol: number
  // Grid lines on the 14-track (half-day) band grid. A stay occupies the
  // second half of its arrival day and the first half of its departure day,
  // so a checkout and the next check-in share a day without ever overlapping.
  colStart: number
  colEnd: number
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

  visibleListings.value.forEach((apt, aptIndex) => {
    if (filterMode.value === 'free') {
      segments.push(...computeFreeSegments(weekDays, apt, aptIndex))
      return
    }

    const aptReservations = effectiveReservations.value.filter(
      (b) =>
        b.listingId === apt.id &&
        holdsDates(b.status) &&
        b.checkIn <= weekEnd &&
        b.checkOut >= weekStart,
    )

    for (const reservation of aptReservations) {
      const segStart = reservation.checkIn >= weekStart ? reservation.checkIn : weekStart
      const segEnd = reservation.checkOut <= weekEnd ? reservation.checkOut : weekEnd

      const startCol = weekDays.findIndex((d) => d.date === segStart) + 1
      const endCol = weekDays.findIndex((d) => d.date === segEnd) + 1
      if (startCol < 1 || endCol < 1) continue

      const isStart = reservation.checkIn === segStart
      const isEnd = reservation.checkOut === segEnd

      segments.push({
        reservation,
        apt,
        aptIndex,
        startCol,
        endCol,
        colStart: isStart ? startCol * 2 : startCol * 2 - 1,
        colEnd: isEnd ? endCol * 2 : endCol * 2 + 1,
        isStart,
        isEnd,
        label: guestName(reservation.guestId),
      })
    }
  })

  return segments
}

function computeFreeSegments(weekDays: DayCell[], apt: Listing, aptIndex: number): Segment[] {
  const segments: Segment[] = []
  const aptReservations = props.reservations.filter(
    (b) => b.listingId === apt.id && holdsDates(b.status),
  )

  const freeFlags = weekDays.map(
    (d) => !aptReservations.some((b) => b.checkIn <= d.date && b.checkOut > d.date),
  )

  let runStart: number | null = null
  for (let i = 0; i <= weekDays.length; i++) {
    const isFree = i < weekDays.length && freeFlags[i]
    if (isFree && runStart === null) {
      runStart = i
    } else if (!isFree && runStart !== null) {
      segments.push({
        reservation: null,
        apt,
        aptIndex,
        startCol: runStart + 1,
        endCol: i,
        colStart: (runStart + 1) * 2 - 1,
        colEnd: i * 2 + 1,
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

function guestName(guestId: string): string {
  return props.guests.find((c) => c.id === guestId)?.name ?? '—'
}
function aptName(aptId: string): string {
  return props.listings.find((a) => a.id === aptId)?.name ?? '—'
}
function channelName(channelId: string): string {
  return props.channels.find((c) => c.id === channelId)?.name ?? '—'
}

// ── Hover highlight ───────────────────────────────────────────────────────────

const hoveredReservationId = ref<string | null>(null)

// ── Drag to resize ────────────────────────────────────────────────────────────

function getDateFromPoint(x: number, y: number): string | null {
  if (!gridRef.value) return null
  const weekEls = gridRef.value.querySelectorAll<HTMLElement>('.cal-week')
  let weekIdx = -1
  for (let i = 0; i < weekEls.length; i++) {
    const r = weekEls[i].getBoundingClientRect()
    if (y >= r.top && y <= r.bottom) { weekIdx = i; break }
  }
  if (weekIdx < 0 || weekIdx >= calWeeks.value.length) return null

  const gridRect = gridRef.value.getBoundingClientRect()
  const col = Math.min(6, Math.max(0, Math.floor((x - gridRect.left) / (gridRect.width / 7))))
  return calWeeks.value[weekIdx].days[col]?.date ?? null
}

function isValidDrag(reservation: Reservation, edge: 'start' | 'end', targetDate: string): boolean {
  const apt = props.listings.find((a) => a.id === reservation.listingId)
  const newFrom = edge === 'start' ? targetDate : reservation.checkIn
  const newToExclusive = edge === 'end' ? targetDate : reservation.checkOut

  if (newFrom >= newToExclusive) return false

  const nights = (Date.parse(newToExclusive) - Date.parse(newFrom)) / 86400000
  if (apt && nights < apt.minNights) return false

  return !props.reservations.some(
    (b) =>
      b.id !== reservation.id &&
      b.listingId === reservation.listingId &&
      holdsDates(b.status) &&
      b.checkIn < newToExclusive &&
      b.checkOut > newFrom,
  )
}

function startDrag(reservation: Reservation, edge: 'start' | 'end') {
  if (!props.isAdmin) return
  const initialDate =
    edge === 'start'
      ? reservation.checkIn
      : reservation.checkOut

  dragState.value = { reservationId: reservation.id, edge, currentDate: initialDate, canDrop: true }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragState.value) return
  const targetDate = getDateFromPoint(e.clientX, e.clientY)
  if (!targetDate) return
  const reservation = props.reservations.find((b) => b.id === dragState.value!.reservationId)
  if (!reservation) return
  const canDrop = isValidDrag(reservation, dragState.value.edge, targetDate)
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
  const reservation = props.reservations.find((b) => b.id === ds.reservationId)
  if (!reservation) return
  const changes =
    ds.edge === 'start'
      ? { checkIn: ds.currentDate }
      : { checkOut: ds.currentDate }
  emit('update', ds.reservationId, changes)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  if (flashTimer !== null) clearTimeout(flashTimer)
})

// ── Popup ─────────────────────────────────────────────────────────────────────

let dragEndedRecently = false

function handleBlockClick(reservation: Reservation, event: MouseEvent) {
  if (dragEndedRecently) { dragEndedRecently = false; return }
  openPopup(reservation, event)
}

const popupReservation = ref<Reservation | null>(null)
const popupPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

function openPopup(reservation: Reservation, event: MouseEvent) {
  popupReservation.value = reservation
  popupPos.value = { x: event.clientX, y: event.clientY }
}
function closePopup() { popupReservation.value = null }

</script>

<template>
  <div class="reservation-calendar" ref="calendarRef">

    <!-- Month navigation -->
    <div class="reservation-calendar__nav">
      <button class="btn btn--ghost btn--sm" @click="prevMonth"><AppIcon name="chevron-left" /></button>
      <span class="reservation-calendar__month-label">{{ monthLabel }}</span>
      <button class="btn btn--ghost btn--sm" @click="goToday">{{ t('calendar.today') }}</button>
      <button class="btn btn--ghost btn--sm" @click="nextMonth"><AppIcon name="chevron-right" /></button>
    </div>

    <!-- Legend -->
    <div class="reservation-calendar__legend">
      <button
        :class="['legend-item', { active: filterMode === 'reservations' && filterApt === '' }]"
        @click="filterMode = 'reservations'; filterApt = ''"
      >{{ t('calendar.allListings') }}</button>
      <button
        :class="['legend-item', { active: filterMode === 'free' }]"
        @click="filterMode = 'free'; filterApt = ''"
      >{{ t('calendar.freeListings') }}</button>
      <button
        v-for="apt in sortedListings"
        :key="apt.id"
        :class="['legend-item', { active: filterApt === apt.id }]"
        @click="filterMode = 'reservations'; filterApt = filterApt === apt.id ? '' : apt.id"
      >
        <span class="legend-item__dot" :style="{ background: aptColor(apt.id) }" />
        {{ apt.name }}
      </button>
    </div>

    <div v-if="loading" class="empty-state"><p>{{ t('common.loading') }}</p></div>

    <template v-else>
      <div class="cal-scroll">
        <div class="cal-grid" ref="gridRef">
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

          <!-- One reservation band per visible listing -->
          <div
            class="cal-band"
            v-for="(apt, ai) in visibleListings"
            :key="apt.id"
          >
            <div
              v-for="seg in week.segments.filter(s => s.aptIndex === ai)"
              :key="seg.reservation?.id ?? `free-${wi}-${ai}-${seg.startCol}`"
              class="reservation-block"
              :class="{
                'reservation-block--start': seg.isStart,
                'reservation-block--end': seg.isEnd,
                'reservation-block--highlighted': hoveredReservationId !== null && hoveredReservationId === seg.reservation?.id,
                'reservation-block--no-drop': dragState !== null && dragState.reservationId === seg.reservation?.id && !dragState.canDrop,
                'reservation-block--free': seg.reservation === null,
              }"
              :style="{
                gridColumnStart: seg.colStart,
                gridColumnEnd: seg.colEnd,
                '--apt-color': aptColor(apt.id),
                '--apt-on-color': aptOnColor(apt.id),
              }"
            >
              <div
                class="reservation-block__surface"
                @mouseenter="seg.reservation ? (hoveredReservationId = seg.reservation.id) : undefined"
                @mouseleave="hoveredReservationId = null"
                @click.stop="seg.reservation ? handleBlockClick(seg.reservation, $event) : undefined"
              >
                <div
                  v-if="seg.isStart && seg.reservation && isAdmin"
                  class="reservation-block__handle reservation-block__handle--left"
                  @mousedown.prevent.stop="startDrag(seg.reservation, 'start')"
                />
                <span class="reservation-block__label">{{ seg.label }}</span>
                <div
                  v-if="seg.isEnd && seg.reservation && isAdmin"
                  class="reservation-block__handle reservation-block__handle--right"
                  @mousedown.prevent.stop="startDrag(seg.reservation, 'end')"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </template>

  </div>

  <ReservationInfoPopup
    v-if="popupReservation"
    :reservation="popupReservation"
    :apt-name="aptName(popupReservation.listingId)"
    :guest-name="guestName(popupReservation.guestId)"
    :channel-name="channelName(popupReservation.channelId)"
    :pos="popupPos"
    @close="closePopup"
    @patch="emit('patch', popupReservation.id, $event)"
  />
</template>
