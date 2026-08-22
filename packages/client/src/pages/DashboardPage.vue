<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { holdsDates } from '../shared/reservationStatus'
import { api } from '../api/client'
import type { Listing, Reservation, Guest, Channel } from '../api/client'
import { useToast } from '../composables/useToast'
import { useAsyncOp } from '../composables/useAsyncOp'
import GuestEditModal from './guests/GuestEditModal.vue'
import TodaySummary from './reservations/TodaySummary.vue'
import ActiveReservationsView from './reservations/ActiveReservationsView.vue'
import UpcomingReservationsView from './reservations/UpcomingReservationsView.vue'

const { t } = useI18n()
const { success, error } = useToast()
const { run } = useAsyncOp()

// ── Data ─────────────────────────────────────────────────────────────────────

const listings = ref<Listing[]>([])
const reservations = ref<Reservation[]>([])
const guests = ref<Guest[]>([])
const channels = ref<Channel[]>([])
const isAdmin = ref(false)
const pageLoading = ref(true)

// ── Reservation window ────────────────────────────────────────────────────────────

function monthsAgo(checkIn: string, months: number): string {
  const d = new Date(checkIn + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]!
}

const loadFromDate = ref(monthsAgo(new Date().toISOString().split('T')[0]!, 2))

// ── Stats ─────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0] ?? ''

const arrivalReservations = computed(() =>
  reservations.value.filter((b) => b.checkIn === today && holdsDates(b.status)),
)
const departureReservations = computed(() =>
  reservations.value.filter((b) => b.checkOut === today && holdsDates(b.status)),
)
const occupiedReservations = computed(() =>
  reservations.value.filter((b) => b.checkIn < today && b.checkOut > today && holdsDates(b.status)),
)

// ── Upcoming reservations (next 7 days, excluding today) ─────────────────────────

const weekLater = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]!
})

const upcomingReservations = computed(() =>
  reservations.value
    .filter((b) => b.checkIn > today && b.checkIn <= weekLater.value && holdsDates(b.status))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
)

// ── Load ──────────────────────────────────────────────────────────────────────

async function load() {
  pageLoading.value = true
  try {
    const cfg = await api.auth.config()
    isAdmin.value = cfg.ok ? cfg.is_admin : false

    const [apts, bks, cls, chs] = await Promise.all([
      api.listings.list(),
      api.reservations.list({ from: loadFromDate.value }),
      api.guests.list(),
      api.channels.list(),
    ])
    listings.value = apts
    reservations.value = bks
    guests.value = cls
    channels.value = chs
  } catch (e) {
    if (e instanceof Error) error(e.message)
  } finally {
    pageLoading.value = false
  }
}

onMounted(load)

// ── Reservation form ───────────────────────────────────────────────────────────────

async function onPatch(id: string, changes: { comment?: string; paidDate?: string }) {
  const res = await run(() => api.reservations.patch(id, changes))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

async function handleUpdate(id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>) {
  const res = await run(() => api.reservations.update(id, payload))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

async function handleDelete(b: Reservation) {
  const res = await run(() => api.reservations.delete(b.id))
  if (res !== undefined) { await load(); success(t('reservations.deleted')) }
}

// ── Guest edit ────────────────────────────────────────────────────────────────

const guestEditTarget = ref<Guest | null>(null)

function openGuest(guest: Guest) {
  guestEditTarget.value = guest
}

async function handleGuestSave(guest: Guest, patch: Partial<Omit<Guest, 'id'>>) {
  const res = await run(() => api.guests.update(guest.id, patch))
  if (res !== undefined) {
    guests.value = guests.value.map((c) => c.id === guest.id ? res : c)
    guestEditTarget.value = null
    success(t('reservations.guestUpdated'))
  }
}

</script>

<template>
  <div class="page-container">
    <!-- Summary -->
    <TodaySummary
      :arrival-count="arrivalReservations.length"
      :departure-count="departureReservations.length"
      :occupied-count="occupiedReservations.length"
    />

    <!-- Active reservations (today) -->
    <ActiveReservationsView
      :arrival-reservations="arrivalReservations"
      :departure-reservations="departureReservations"
      :occupied-reservations="occupiedReservations"
      :listings="listings"
      :guests="guests"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @delete="handleDelete"
      @open-guest="openGuest"
    />

    <!-- Upcoming reservations -->
    <UpcomingReservationsView
      :reservations="upcomingReservations"
      :listings="listings"
      :guests="guests"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @delete="handleDelete"
      @open-guest="openGuest"
    />
  </div>

  <!-- Guest edit/info modal -->
  <GuestEditModal
    v-if="guestEditTarget"
    :guest="guestEditTarget"
    :is-admin="isAdmin"
    @save="handleGuestSave"
    @close="guestEditTarget = null"
  />
</template>
