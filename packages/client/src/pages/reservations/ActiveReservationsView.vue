<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, Listing, Guest, Channel } from '../../api/client'
import ReservationItem from './ReservationItem.vue'

const { t } = useI18n()

const props = defineProps<{
  arrivalReservations: Reservation[]
  departureReservations: Reservation[]
  occupiedReservations: Reservation[]
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

const allReservations = computed(() => [
  ...props.arrivalReservations,
  ...props.departureReservations,
  ...props.occupiedReservations,
])
</script>

<template>
  <div v-if="allReservations.length" class="active-reservations">
    <div class="table-wrap">
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
            v-for="b in allReservations"
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

