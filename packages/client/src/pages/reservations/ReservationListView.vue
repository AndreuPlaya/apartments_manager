<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, ReservationStatus, Listing, Guest, Channel } from '../../api/client'
import AppIcon from '../../shared/AppIcon.vue'
import { holdsDates, RESERVATION_STATUSES, statusLabelKey } from '../../shared/reservationStatus'
import ReservationItem from './ReservationItem.vue'

const { t } = useI18n()

const props = defineProps<{
  reservations: Reservation[]
  listings: Listing[]
  guests: Guest[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  loadingMore: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  transition: [id: string, status: ReservationStatus]
  delete: [reservation: Reservation]
  openGuest: [guest: Guest]
  loadMore: []
}>()

// ── Filters ───────────────────────────────────────────────────────────────────

const filterListing = ref('')
const filterStatus = ref('')
const filterFrom = ref('')
const filterTo = ref('')

// ── Sorting ───────────────────────────────────────────────────────────────────

const sortField = ref<'guest' | 'checkIn' | 'checkOut'>('checkIn')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(field: 'guest' | 'checkIn' | 'checkOut') {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDir.value = 'desc' }
}

// ── Lookup maps ───────────────────────────────────────────────────────────────

const guestMap = computed(() => Object.fromEntries(props.guests.map((c) => [c.id, c])))

// ── Filtered reservations ─────────────────────────────────────────────────────────

const filteredReservations = computed(() => {
  let list = [...props.reservations]
  if (filterListing.value) list = list.filter((b) => b.listingId === filterListing.value)
  if (filterStatus.value === 'unpaid') list = list.filter((b) => !b.paidDate && holdsDates(b.status))
  else if (filterStatus.value === 'paid') list = list.filter((b) => !!b.paidDate)
  else if (filterStatus.value) list = list.filter((b) => b.status === filterStatus.value)
  if (filterFrom.value) list = list.filter((b) => b.checkOut > filterFrom.value)
  if (filterTo.value) list = list.filter((b) => b.checkIn < filterTo.value)
  list.sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'guest')
      cmp = (guestMap.value[a.guestId]?.name ?? '').localeCompare(guestMap.value[b.guestId]?.name ?? '')
    else if (sortField.value === 'checkIn') cmp = a.checkIn.localeCompare(b.checkIn)
    else cmp = a.checkOut.localeCompare(b.checkOut)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

const hasFilters = computed(() => !!(filterListing.value || filterStatus.value || filterFrom.value || filterTo.value))

function clearFilters() {
  filterListing.value = ''
  filterStatus.value = ''
  filterFrom.value = ''
  filterTo.value = ''
}
</script>

<template>
  <!-- Filters -->
  <div class="filters">
    <select v-model="filterListing">
      <option value="">{{ t('reservations.allListings') }}</option>
      <option v-for="a in listings" :key="a.id" :value="a.id">{{ a.name }}</option>
    </select>
    <select v-model="filterStatus">
      <option value="">{{ t('reservations.allStatuses') }}</option>
      <option value="unpaid">{{ t('reservations.notPaid') }}</option>
      <option value="paid">{{ t('reservations.paid') }}</option>
      <option v-for="s in RESERVATION_STATUSES" :key="s" :value="s">
        {{ t(statusLabelKey(s)) }}
      </option>
    </select>
    <input v-model="filterFrom" type="date" :title="t('reservations.filterFrom')" />
    <input v-model="filterTo" type="date" :title="t('reservations.filterTo')" />
    <button v-if="hasFilters" class="btn btn--ghost btn--sm" @click="clearFilters">{{ t('reservations.clearFilters') }}</button>
  </div>

  <!-- Loading / empty states -->
  <div v-if="loading" class="empty-state"><p>{{ t('common.loading') }}</p></div>
  <div v-else-if="filteredReservations.length === 0" class="empty-state">
    <p>{{ t('reservations.noMatch') }}</p>
  </div>

  <!-- Table -->
  <template v-else>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('reservations.listing') }}</th>
            <th style="width: 1.5rem"></th>
            <th class="sortable-th" @click="toggleSort('guest')">
              {{ t('reservations.guest') }}
              <AppIcon
                :name="sortField === 'guest' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'guest' }"
              />
            </th>
            <th class="sortable-th" @click="toggleSort('checkIn')">
              {{ t('reservations.checkin') }}
              <AppIcon
                :name="sortField === 'checkIn' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'checkIn' }"
              />
            </th>
            <th class="sortable-th" @click="toggleSort('checkOut')">
              {{ t('reservations.checkout') }}
              <AppIcon
                :name="sortField === 'checkOut' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'"
                :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortField === 'checkOut' }"
              />
            </th>
            <th>{{ t('reservations.guests') }}</th>
            <th style="width: 2rem" />
            <th />
          </tr>
        </thead>
        <tbody>
          <ReservationItem
            v-for="b in filteredReservations"
            :key="b.id"
            :reservation="b"
            :listings="listings"
            :guests="guests"
            :channels="channels"
            :is-admin="isAdmin"
            :loading="loading"
            :today="today"
            @update="(id, payload) => emit('update', id, payload)"
            @patch="(id, changes) => emit('patch', id, changes)"
            @transition="(id, status) => emit('transition', id, status)"
            @delete="(reservation) => emit('delete', reservation)"
            @open-guest="(guest) => emit('openGuest', guest)"
          />
        </tbody>
      </table>
    </div>

    <!-- Load more -->
    <div class="load-more-row">
      <button class="btn btn--ghost btn--sm" :disabled="loadingMore" @click="emit('loadMore')">
        {{ loadingMore ? t('common.loading') : t('reservations.loadMore') }}
      </button>
    </div>
  </template>
</template>

