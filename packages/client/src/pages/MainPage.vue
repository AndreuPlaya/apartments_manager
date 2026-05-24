<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'
import type { Apartment, Booking, Client, Channel } from '../api/client'
import { useToast } from '../composables/useToast'
import { useAsyncOp } from '../composables/useAsyncOp'
import ClientEditModal from './clients/ClientEditModal.vue'
import TodaySummary from './bookings/TodaySummary.vue'
import ActiveBookingsView from './bookings/ActiveBookingsView.vue'
import UpcomingBookingsView from './bookings/UpcomingBookingsView.vue'
import type { BookingStatus } from '../api/client'

const { success, error } = useToast()
const { run } = useAsyncOp()

// ── Data ─────────────────────────────────────────────────────────────────────

const apartments = ref<Apartment[]>([])
const bookings = ref<Booking[]>([])
const clients = ref<Client[]>([])
const channels = ref<Channel[]>([])
const isAdmin = ref(false)
const pageLoading = ref(true)

// ── Booking window ────────────────────────────────────────────────────────────

function monthsAgo(fromDate: string, months: number): string {
  const d = new Date(fromDate + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]!
}

const loadFromDate = ref(monthsAgo(new Date().toISOString().split('T')[0]!, 2))

// ── Stats ─────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0] ?? ''

const arrivalBookings = computed(() =>
  bookings.value.filter((b) => b.fromDate === today && b.status !== 'Cancelled'),
)
const departureBookings = computed(() =>
  bookings.value.filter((b) => b.toDate === today && b.status !== 'Cancelled'),
)
const occupiedBookings = computed(() =>
  bookings.value.filter((b) => b.fromDate < today && b.toDate > today && b.status !== 'Cancelled'),
)

// ── Upcoming bookings (next 7 days, excluding today) ─────────────────────────

const weekLater = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]!
})

const upcomingBookings = computed(() =>
  bookings.value
    .filter((b) => b.fromDate > today && b.fromDate <= weekLater.value && b.status !== 'Cancelled')
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate)),
)

// ── Load ──────────────────────────────────────────────────────────────────────

async function load() {
  pageLoading.value = true
  try {
    const cfg = await api.auth.config()
    isAdmin.value = cfg.ok ? cfg.is_admin : false

    const [apts, bks, cls, chs] = await Promise.all([
      api.apartments.list(),
      api.bookings.list({ from: loadFromDate.value }),
      api.clients.list(),
      api.channels.list(),
    ])
    apartments.value = apts
    bookings.value = bks
    clients.value = cls
    channels.value = chs
  } catch (e) {
    if (e instanceof Error) error(e.message)
  } finally {
    pageLoading.value = false
  }
}

onMounted(load)

// ── Booking form ───────────────────────────────────────────────────────────────

async function onPatch(id: string, changes: { comment?: string; status?: BookingStatus; paidDate?: string }) {
  const res = await run(() => api.bookings.patch(id, changes))
  if (res !== undefined) {
    bookings.value = bookings.value.map((b) => b.id === id ? res : b)
    success('Booking updated')
  }
}

async function handleUpdate(id: string, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>) {
  const res = await run(() => api.bookings.update(id, payload))
  if (res !== undefined) {
    bookings.value = bookings.value.map((b) => b.id === id ? res : b)
    success('Booking updated')
  }
}

async function handleCancel(b: Booking) {
  const res = await run(() => api.bookings.patch(b.id, { status: 'Cancelled' }))
  if (res !== undefined) {
    bookings.value = bookings.value.map((x) => x.id === b.id ? res : x)
    success('Booking cancelled')
  }
}

// ── Client edit ────────────────────────────────────────────────────────────────

const clientEditTarget = ref<Client | null>(null)

function openClient(client: Client) {
  clientEditTarget.value = client
}

async function handleClientSave(client: Client, patch: Partial<Omit<Client, 'id'>>) {
  const res = await run(() => api.clients.update(client.id, patch))
  if (res !== undefined) {
    clients.value = clients.value.map((c) => c.id === client.id ? res : c)
    clientEditTarget.value = null
    success('Client updated')
  }
}

</script>

<template>
  <div class="page-container">
    <!-- Summary -->
    <TodaySummary
      :arrival-count="arrivalBookings.length"
      :departure-count="departureBookings.length"
      :occupied-count="occupiedBookings.length"
    />

    <!-- Active bookings (today) -->
    <ActiveBookingsView
      :arrival-bookings="arrivalBookings"
      :departure-bookings="departureBookings"
      :occupied-bookings="occupiedBookings"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @cancel="handleCancel"
      @open-client="openClient"
    />

    <!-- Upcoming bookings -->
    <UpcomingBookingsView
      :bookings="upcomingBookings"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @cancel="handleCancel"
      @open-client="openClient"
    />
  </div>

  <!-- Client edit/info modal -->
  <ClientEditModal
    v-if="clientEditTarget"
    :client="clientEditTarget"
    :is-admin="isAdmin"
    @save="handleClientSave"
    @close="clientEditTarget = null"
  />
</template>

