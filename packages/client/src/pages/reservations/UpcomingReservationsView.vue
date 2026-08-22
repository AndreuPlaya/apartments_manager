<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Reservation, Listing, Guest, Channel } from '../../api/client'
import ReservationItem from './ReservationItem.vue'
import AppIcon from '../../shared/AppIcon.vue'

const { t } = useI18n()

defineProps<{
  reservations: Reservation[]
  listings: Listing[]
  guests: Guest[]
  channels: Channel[]
  isAdmin: boolean
  loading: boolean
  today: string
}>()

const emit = defineEmits<{
  update: [id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>]
  patch: [id: string, changes: { paidDate?: string; comment?: string }]
  delete: [reservation: Reservation]
  openGuest: [guest: Guest]
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

    <div v-else-if="reservations.length === 0" class="upcoming-empty">
      <AppIcon name="calendar" :size="20" :stroke-width="1.5" />
      {{ t('dashboard.noUpcoming') }}
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('reservations.listing') }}</th>
            <th style="width: 1.5rem"></th>
            <th>{{ t('reservations.guest') }}</th>
            <th>{{ t('reservations.checkin') }}</th>
            <th>{{ t('reservations.checkout') }}</th>
            <th>{{ t('reservations.guests') }}</th>
            <th style="width: 2rem"></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <ReservationItem
            v-for="b in reservations"
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
            @delete="(reservation) => emit('delete', reservation)"
            @open-guest="(guest) => emit('openGuest', guest)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

