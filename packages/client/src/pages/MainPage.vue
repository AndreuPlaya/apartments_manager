<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'
import type { Apartment, Booking, Client, Channel } from '../api/client'
import { useToast } from '../composables/useToast'
import { useAsyncOp } from '../composables/useAsyncOp'
import BookingFormModal from './main/BookingFormModal.vue'
import BookingListView from './main/BookingListView.vue'
import ClientEditModal from './main/ClientEditModal.vue'
import CalendarView from './main/CalendarView.vue'
import TodaySummary from './main/TodaySummary.vue'
import ActiveBookingsView from './main/ActiveBookingsView.vue'
import AppIcon from '../components/AppIcon.vue'
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
const loadingMore = ref(false)

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

function openEdit(b: Booking) {
  editingBooking.value = b
  showForm.value = true
}

async function onFormSave() {
  showForm.value = false
  await load()
  success(editingBooking.value ? 'Booking updated' : 'Booking created')
}

async function updateBookingDates(id: string, changes: { fromDate?: string; toDate?: string }) {
  const res = await run(() => api.bookings.update(id, changes))
  if (res !== undefined) { await load(); success('Booking updated') }
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

async function handleLoadMore() {
  loadingMore.value = true
  try {
    loadFromDate.value = monthsAgo(loadFromDate.value, 1)
    const bks = await api.bookings.list({ from: loadFromDate.value })
    bookings.value = bks
  } catch (e) {
    if (e instanceof Error) error(e.message)
  } finally {
    loadingMore.value = false
  }
}

async function deleteBooking(b: Booking) {
  const res = await run(() => api.bookings.delete(b.id))
  if (res !== undefined) {
    await load()
    success('Booking deleted')
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

// ── View mode ─────────────────────────────────────────────────────────────────

const viewMode = ref<'list' | 'calendar'>('calendar')
</script>

<template>
  <div class="page-container">
    <!-- Summary -->
    <TodaySummary
      :arrival-count="arrivalBookings.length"
      :departure-count="departureBookings.length"
      :occupied-count="occupiedBookings.length"
    />

    <!-- Active bookings -->
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

    <!-- Header -->
    <div class="page-header">
      <h2>Bookings</h2>
      <div class="view-toggle">
        <button :class="['view-toggle__btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'" title="List view">
          <AppIcon name="list" />
          List
        </button>
        <button :class="['view-toggle__btn', { active: viewMode === 'calendar' }]" @click="viewMode = 'calendar'" title="Calendar view">
          <AppIcon name="calendar" />
          Calendar
        </button>
      </div>
      <div class="page-header__spacer" />
      <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">+ New booking</button>
    </div>

    <!-- List view -->
    <BookingListView
      v-if="viewMode === 'list'"
      :bookings="bookings"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :loading-more="loadingMore"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @cancel="handleCancel"
      @open-client="openClient"
      @load-more="handleLoadMore"
    />

    <!-- Calendar view -->
    <CalendarView
      v-else
      :bookings="bookings"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      @edit="openEdit"
      @delete="deleteBooking"
      @update="updateBookingDates"
      @patch="onPatch"
    />
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
