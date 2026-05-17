<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'
import type { Apartment, Booking, Client, Channel } from '../api/client'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import { useAsyncOp } from '../composables/useAsyncOp'
import BookingFormModal from './main/BookingFormModal.vue'
import CalendarView from './main/CalendarView.vue'

const { success, error } = useToast()
const { confirm } = useConfirm()
const { loading: saving, run } = useAsyncOp()

// ── Data ─────────────────────────────────────────────────────────────────────

const apartments = ref<Apartment[]>([])
const bookings = ref<Booking[]>([])
const clients = ref<Client[]>([])
const channels = ref<Channel[]>([])
const isAdmin = ref(false)
const pageLoading = ref(true)

// ── Filters ───────────────────────────────────────────────────────────────────

const filterApartment = ref('')
const filterStatus = ref('')
const filterFrom = ref('')
const filterTo = ref('')

// ── Lookup maps ───────────────────────────────────────────────────────────────

const aptMap = computed(() => Object.fromEntries(apartments.value.map((a) => [a.id, a])))
const clientMap = computed(() => Object.fromEntries(clients.value.map((c) => [c.id, c])))
const channelMap = computed(() => Object.fromEntries(channels.value.map((c) => [c.id, c])))

// ── Sorting ───────────────────────────────────────────────────────────────────

const sortField = ref<'client' | 'fromDate' | 'toDate'>('fromDate')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(field: 'client' | 'fromDate' | 'toDate') {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDir.value = 'desc' }
}

// ── Filtered bookings ─────────────────────────────────────────────────────────

const filteredBookings = computed(() => {
  let list = [...bookings.value]
  if (filterApartment.value) list = list.filter((b) => b.apartmentId === filterApartment.value)
  if (filterStatus.value) list = list.filter((b) => b.status === filterStatus.value)
  if (filterFrom.value) list = list.filter((b) => b.toDate > filterFrom.value)
  if (filterTo.value) list = list.filter((b) => b.fromDate < filterTo.value)
  list.sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'client')
      cmp = (clientMap.value[a.clientId]?.name ?? '').localeCompare(clientMap.value[b.clientId]?.name ?? '')
    else if (sortField.value === 'fromDate') cmp = a.fromDate.localeCompare(b.fromDate)
    else cmp = a.toDate.localeCompare(b.toDate)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

// ── Stats ─────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0] ?? ''

const todayArrivals = computed(
  () => bookings.value.filter((b) => b.fromDate === today && b.status !== 'Cancelled').length,
)
const todayDepartures = computed(
  () => bookings.value.filter((b) => b.toDate === today && b.status !== 'Cancelled').length,
)
const currentlyOccupied = computed(
  () => bookings.value.filter((b) => b.fromDate <= today && b.toDate > today && b.status !== 'Cancelled').length,
)

// ── Load ──────────────────────────────────────────────────────────────────────

async function load() {
  pageLoading.value = true
  try {
    const cfg = await api.auth.config()
    isAdmin.value = cfg.ok ? cfg.is_admin : false

    const [apts, bks, cls, chs] = await Promise.all([
      api.apartments.list(),
      api.bookings.list(),
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

async function deleteBooking(b: Booking) {
  const apt = aptMap.value[b.apartmentId]?.name ?? 'unknown'
  const ok = await confirm(`Delete booking for ${apt}? This cannot be undone.`)
  if (!ok) return
  const res = await run(() => api.bookings.delete(b.id))
  if (res !== undefined) {
    await load()
    success('Booking deleted')
  }
}

// ── View mode ─────────────────────────────────────────────────────────────────

const viewMode = ref<'list' | 'calendar'>('list')

// ── Formatting ────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function nights(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
}
</script>

<template>
  <div class="page-container">
    <!-- Summary -->
    <div class="summary-strip">
      <div class="stat-card">
        <div class="stat-card__value">{{ todayArrivals }}</div>
        <div class="stat-card__label">Today's arrivals</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">{{ todayDepartures }}</div>
        <div class="stat-card__label">Today's departures</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">{{ currentlyOccupied }}</div>
        <div class="stat-card__label">Currently occupied</div>
      </div>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h2>Bookings</h2>
      <div class="view-toggle">
        <button :class="['view-toggle__btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'" title="List view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor"/>
            <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor"/>
            <rect x="1" y="11" width="14" height="2" rx="1" fill="currentColor"/>
          </svg>
          List
        </button>
        <button :class="['view-toggle__btn', { active: viewMode === 'calendar' }]" @click="viewMode = 'calendar'" title="Calendar view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.5"/>
            <line x1="5" y1="1" x2="5" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="11" y1="1" x2="11" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Calendar
        </button>
      </div>
      <div class="page-header__spacer" />
      <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">+ New booking</button>
    </div>

    <!-- List view -->
    <template v-if="viewMode === 'list'">
      <!-- Filters -->
      <div class="filters">
        <select v-model="filterApartment">
          <option value="">All apartments</option>
          <option v-for="a in apartments" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="filterStatus">
          <option value="">All statuses</option>
          <option value="NotPaid">Not paid</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input v-model="filterFrom" type="date" title="From date" />
        <input v-model="filterTo" type="date" title="To date" />
        <button
          v-if="filterApartment || filterStatus || filterFrom || filterTo"
          class="btn btn--ghost btn--sm"
          @click="filterApartment = ''; filterStatus = ''; filterFrom = ''; filterTo = ''"
        >
          Clear
        </button>
      </div>

      <!-- Table -->
      <div v-if="pageLoading" class="empty-state"><p>Loading…</p></div>
      <div v-else-if="filteredBookings.length === 0" class="empty-state">
        <p>No bookings match the current filters.</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Apartment</th>
              <th class="sortable-th" @click="toggleSort('client')">
                Client <span class="sort-icon" :class="{ 'sort-icon--active': sortField === 'client' }">{{ sortField === 'client' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th class="sortable-th" @click="toggleSort('fromDate')">
                Check-in <span class="sort-icon" :class="{ 'sort-icon--active': sortField === 'fromDate' }">{{ sortField === 'fromDate' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th class="sortable-th" @click="toggleSort('toDate')">
                Check-out <span class="sort-icon" :class="{ 'sort-icon--active': sortField === 'toDate' }">{{ sortField === 'toDate' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th>Nights</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Channel</th>
              <th v-if="isAdmin" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in filteredBookings"
              :key="b.id"
              :class="{
                'row--arriving': b.fromDate === today && b.status !== 'Cancelled',
                'row--staying': b.fromDate < today && b.toDate > today && b.status !== 'Cancelled',
              }"
            >
              <td>{{ aptMap[b.apartmentId]?.name ?? '—' }}</td>
              <td>{{ clientMap[b.clientId]?.name ?? '—' }}</td>
              <td>{{ formatDate(b.fromDate) }}</td>
              <td>{{ formatDate(b.toDate) }}</td>
              <td>{{ nights(b.fromDate, b.toDate) }}</td>
              <td>{{ b.adultCount + b.childrenCount }}</td>
              <td>
                <span
                  :class="['badge', b.status === 'Paid' ? 'badge--paid' : b.status === 'NotPaid' ? 'badge--notpaid' : 'badge--cancelled']"
                >{{ b.status === 'NotPaid' ? 'Not paid' : b.status }}</span>
              </td>
              <td>€{{ b.totalAmountDue.toFixed(2) }}</td>
              <td>{{ channelMap[b.channelId]?.name ?? '—' }}</td>
              <td v-if="isAdmin">
                <div class="action-btns">
                  <button class="btn btn--ghost btn--sm" @click="openEdit(b)">Edit</button>
                  <button class="btn btn--ghost btn--sm text-danger" @click="deleteBooking(b)">Del</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

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
</template>
