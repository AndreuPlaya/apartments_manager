<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import BookingItem from './BookingItem.vue'
import AppIcon from '../../shared/AppIcon.vue'

const { t } = useI18n()

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
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  delete: [booking: Booking]
  openClient: [client: Client]
}>()
</script>

<template>
  <div class="upcoming-section">
    <div class="page-header">
      <h2>{{ t('dashboard.upcoming') }} <span class="upcoming-section__subtitle">{{ t('dashboard.upcomingSubtitle') }}</span></h2>
    </div>

    <div v-if="loading" class="upcoming-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-row" />
    </div>

    <div v-else-if="bookings.length === 0" class="upcoming-empty">
      <AppIcon name="calendar" :size="20" :stroke-width="1.5" />
      {{ t('dashboard.noUpcoming') }}
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('bookings.apartment') }}</th>
            <th style="width: 1.5rem"></th>
            <th>{{ t('bookings.client') }}</th>
            <th>{{ t('bookings.checkin') }}</th>
            <th>{{ t('bookings.checkout') }}</th>
            <th>{{ t('bookings.guests') }}</th>
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
            @delete="(booking) => emit('delete', booking)"
            @open-client="(client) => emit('openClient', client)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

