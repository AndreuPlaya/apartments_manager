<script setup lang="ts">
import type { Booking, Apartment, Client, Channel, BookingStatus } from '../../api/client'
import BookingItem from './BookingItem.vue'

defineProps<{
  bookings: Booking[]
  apartments: Apartment[]
  clients: Client[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string; status?: BookingStatus }]
  cancel: [booking: Booking]
  openClient: [client: Client]
}>()
</script>

<template>
  <div class="upcoming-section">
    <div class="page-header">
      <h2>Upcoming <span class="upcoming-section__subtitle">next 7 days</span></h2>
    </div>

    <div v-if="loading" class="upcoming-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-row" />
    </div>

    <div v-else-if="bookings.length === 0" class="upcoming-empty">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      No arrivals in the next 7 days
    </div>

    <table v-else class="bookings-table">
      <thead>
        <tr>
          <th>Apartment</th>
          <th>Client</th>
          <th>Check-in</th>
          <th>Check-out</th>
          <th>Guests</th>
          <th style="width: 2rem"></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <BookingItem
          v-for="b in bookings"
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
