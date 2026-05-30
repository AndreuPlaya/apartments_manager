<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Booking, Apartment, Client, Channel, BookingStatus } from '../../api/client'
import BookingItem from './BookingItem.vue'

const { t } = useI18n()

const props = defineProps<{
  arrivalBookings: Booking[]
  departureBookings: Booking[]
  occupiedBookings: Booking[]
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

const allBookings = computed(() => [
  ...props.arrivalBookings,
  ...props.departureBookings,
  ...props.occupiedBookings,
])
</script>

<template>
  <div v-if="allBookings.length" class="active-bookings">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('bookings.apartment') }}</th>
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
            v-for="b in allBookings"
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
  </div>
</template>

<style scoped>
.active-bookings {
  margin-bottom: 1.5rem;
}
</style>
