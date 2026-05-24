<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import AppIcon from '../../shared/AppIcon.vue'
import BookingItem from './BookingItem.vue'

const props = defineProps<{
  bookings: Booking[]
  apartments: Apartment[]
  clients: Client[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  loadingMore: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  cancel: [booking: Booking]
  openClient: [client: Client]
  loadMore: []
}>()

// ── Filters ───────────────────────────────────────────────────────────────────

const filterApartment = ref('')
const filterStatus = ref('')
const filterFrom = ref('')
const filterTo = ref('')

// ── Sorting ───────────────────────────────────────────────────────────────────

const sortField = ref<'client' | 'fromDate' | 'toDate'>('fromDate')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(field: 'client' | 'fromDate' | 'toDate') {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDir.value = 'desc' }
}

// ── Lookup maps ───────────────────────────────────────────────────────────────

const clientMap = computed(() => Object.fromEntries(props.clients.map((c) => [c.id, c])))

// ── Filtered bookings ─────────────────────────────────────────────────────────

const filteredBookings = computed(() => {
  let list = [...props.bookings]
  if (filterApartment.value) list = list.filter((b) => b.apartmentId === filterApartment.value)
  if (filterStatus.value === 'unpaid') list = list.filter((b) => !b.paidDate && b.status !== 'Cancelled')
  else if (filterStatus.value === 'paid') list = list.filter((b) => !!b.paidDate)
  else if (filterStatus.value) list = list.filter((b) => b.status === filterStatus.value)
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

const hasFilters = computed(() => !!(filterApartment.value || filterStatus.value || filterFrom.value || filterTo.value))

function clearFilters() {
  filterApartment.value = ''
  filterStatus.value = ''
  filterFrom.value = ''
  filterTo.value = ''
}
</script>

<template>
  <!-- Filters -->
  <div class="filters">
    <select v-model="filterApartment">
      <option value="">All apartments</option>
      <option v-for="a in apartments" :key="a.id" :value="a.id">{{ a.name }}</option>
    </select>
    <select v-model="filterStatus">
      <option value="">All statuses</option>
      <option value="unpaid">Not paid</option>
      <option value="paid">Paid</option>
      <option value="Cancelled">Cancelled</option>
    </select>
    <input v-model="filterFrom" type="date" title="From date" />
    <input v-model="filterTo" type="date" title="To date" />
    <button v-if="hasFilters" class="btn btn--ghost btn--sm" @click="clearFilters">Clear</button>
  </div>

  <!-- Loading / empty states -->
  <div v-if="loading" class="empty-state"><p>Loading…</p></div>
  <div v-else-if="filteredBookings.length === 0" class="empty-state">
    <p>No bookings match the current filters.</p>
  </div>

  <!-- Table -->
  <template v-else>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Apartment</th>
            <th class="sortable-th" @click="toggleSort('client')">
              Client
              <AppIcon
                :name="sortField === 'client' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'client' }"
              />
            </th>
            <th class="sortable-th" @click="toggleSort('fromDate')">
              Check-in
              <AppIcon
                :name="sortField === 'fromDate' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'fromDate' }"
              />
            </th>
            <th class="sortable-th" @click="toggleSort('toDate')">
              Check-out
              <AppIcon
                :name="sortField === 'toDate' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'toDate' }"
              />
            </th>
            <th>Guests</th>
            <th style="width: 2rem" />
            <th />
          </tr>
        </thead>
        <tbody>
          <BookingItem
            v-for="b in filteredBookings"
            :key="b.id"
            :booking="b"
            :apartments="apartments"
            :clients="clients"
            :channels="channels"
            :is-admin="isAdmin"
            :loading="loading"
            :today="today"
            @update="(id, payload) => emit('update', id, payload)"
            @patch="(id, changes) => emit('patch', id, changes)"
            @cancel="(booking) => emit('cancel', booking)"
            @open-client="(client) => emit('openClient', client)"
          />
        </tbody>
      </table>
    </div>

    <!-- Load more -->
    <div class="load-more-row">
      <button class="btn btn--ghost btn--sm" :disabled="loadingMore" @click="emit('loadMore')">
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </template>
</template>

<style scoped>
.load-more-row {
  display: flex;
  justify-content: center;
  padding: 1rem 0 0.5rem;
}
</style>
