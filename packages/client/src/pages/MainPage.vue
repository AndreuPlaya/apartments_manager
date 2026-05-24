<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'
import type { Apartment, Booking, Client, Channel } from '../api/client'
import { useToast } from '../composables/useToast'
import { useAsyncOp } from '../composables/useAsyncOp'
import BookingFormModal from './bookings/BookingFormModal.vue'
import ClientEditModal from './clients/ClientEditModal.vue'
import TodaySummary from './bookings/TodaySummary.vue'
import ActiveBookingsView from './bookings/ActiveBookingsView.vue'
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

const showForm = ref(false)
const editingBooking = ref<Booking | null>(null)

function openCreate() {
  editingBooking.value = null
  showForm.value = true
}

async function onFormSave() {
  showForm.value = false
  await load()
  success(editingBooking.value ? 'Booking updated' : 'Booking created')
}

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function clientName(clientId: string) {
  return clients.value.find(c => c.id === clientId)?.name ?? '—'
}

function apartmentName(apartmentId: string) {
  return apartments.value.find(a => a.id === apartmentId)?.name ?? '—'
}

function nightCount(fromDate: string, toDate: string) {
  const from = new Date(fromDate + 'T00:00:00')
  const to = new Date(toDate + 'T00:00:00')
  return Math.round((to.getTime() - from.getTime()) / 86400000)
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
    <div class="upcoming-section">
      <div class="page-header">
        <h2>Upcoming <span class="upcoming-section__subtitle">next 7 days</span></h2>
        <div class="page-header__spacer" />
        <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">+ New booking</button>
      </div>

      <div v-if="pageLoading" class="upcoming-skeleton">
        <div v-for="i in 3" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="upcomingBookings.length === 0" class="upcoming-empty">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        No arrivals in the next 7 days
      </div>

      <table v-else class="upcoming-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Apartment</th>
            <th>Guest</th>
            <th>Nights</th>
            <th>Guests</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in upcomingBookings" :key="b.id" class="upcoming-row">
            <td class="upcoming-date">{{ b.fromDate }}</td>
            <td>{{ apartmentName(b.apartmentId) }}</td>
            <td>{{ clientName(b.clientId) }}</td>
            <td>{{ nightCount(b.fromDate, b.toDate) }}</td>
            <td>{{ b.adultCount + (b.childrenCount ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Booking form modal -->
  <BookingFormModal
    v-if="showForm"
    :booking="editingBooking"
    :apartments="apartments"
    :clients="clients"
    :channels="channels"
    @save="onFormSave"
    @close="showForm = false"
  />

  <!-- Client edit/info modal -->
  <ClientEditModal
    v-if="clientEditTarget"
    :client="clientEditTarget"
    :is-admin="isAdmin"
    @save="handleClientSave"
    @close="clientEditTarget = null"
  />
</template>

<style scoped>
.upcoming-section {
  margin-top: 2rem;
}

.upcoming-section__subtitle {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 0.375rem;
  text-transform: lowercase;
}

.upcoming-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  font-size: 0.875rem;
}

.upcoming-table thead th {
  padding: 0.65rem 0.875rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.upcoming-table tbody td {
  padding: 0.65rem 0.875rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.upcoming-table tbody tr:last-child td {
  border-bottom: none;
}

.upcoming-row:hover td {
  background: var(--accent-light);
}

.upcoming-date {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.upcoming-empty {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1.5rem 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 0.875rem;
}

.upcoming-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row {
  height: 44px;
  background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
