<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/client'
import type { Listing, Reservation, Guest, Channel } from '../../api/client'
import { useToast } from '../../composables/useToast'
import { reportError, useAsyncOp } from '../../composables/useAsyncOp'
import CalendarView from './CalendarView.vue'
import ReservationFormModal from './ReservationFormModal.vue'
import GuestEditModal from '../guests/GuestEditModal.vue'

const { t } = useI18n()
const { success, error } = useToast()
const { run } = useAsyncOp()

// ── Data ──────────────────────────────────────────────────────────────────────

const listings = ref<Listing[]>([])
const reservations = ref<Reservation[]>([])
const guests = ref<Guest[]>([])
const channels = ref<Channel[]>([])
const isAdmin = ref(false)
const pageLoading = ref(true)

function monthsAgo(checkIn: string, months: number): string {
  const d = new Date(checkIn + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]!
}

const loadFromDate = ref(monthsAgo(new Date().toISOString().split('T')[0]!, 2))

async function onMonthChange(year: number, month: number) {
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  if (firstOfMonth < loadFromDate.value) {
    loadFromDate.value = firstOfMonth
    await load()
  }
}

async function load() {
  pageLoading.value = true
  try {
    const cfg = await api.auth.config()
    isAdmin.value = cfg.ok ? cfg.is_admin : false

    const [apts, bks, cls, chs] = await Promise.all([
      api.listings.list(),
      api.reservations.list({ from: loadFromDate.value }),
      api.guests.list(),
      api.channels.list(),
    ])
    listings.value = apts
    reservations.value = bks
    guests.value = cls
    channels.value = chs
  } catch (e) {
    reportError(e)
  } finally {
    pageLoading.value = false
  }
}

onMounted(load)

// ── Reservation form ──────────────────────────────────────────────────────────────

const showForm = ref(false)
const editingReservation = ref<Reservation | null>(null)

function openCreate() {
  editingReservation.value = null
  showForm.value = true
}


async function onFormSave() {
  showForm.value = false
  await load()
  success(editingReservation.value ? t('reservations.updated') : t('reservations.created'))
}

async function updateReservationDates(id: string, changes: { checkIn?: string; checkOut?: string }) {
  const res = await run(() => api.reservations.update(id, changes))
  if (res !== undefined) { await load(); success(t('reservations.updated')) }
}

async function onPatch(id: string, changes: { comment?: string; paidDate?: string }) {
  const res = await run(() => api.reservations.patch(id, changes))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

async function handleUpdate(id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>) {
  const res = await run(() => api.reservations.update(id, payload))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

// ── Guest edit ───────────────────────────────────────────────────────────────

const guestEditTarget = ref<Guest | null>(null)

function openGuest(guest: Guest) {
  guestEditTarget.value = guest
}

async function handleGuestSave(guest: Guest, patch: Partial<Omit<Guest, 'id'>>) {
  const res = await run(() => api.guests.update(guest.id, patch))
  if (res !== undefined) {
    guests.value = guests.value.map((c) => c.id === guest.id ? res : c)
    guestEditTarget.value = null
    success(t('reservations.guestUpdated'))
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('calendar.title') }}</h2>
      <div class="page-header__spacer" />
      <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">{{ t('reservations.newReservation') }}</button>
    </div>

    <CalendarView
      :reservations="reservations"
      :listings="listings"
      :guests="guests"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      @update="updateReservationDates"
      @patch="onPatch"
      @month-change="onMonthChange"
    />
  </div>

  <ReservationFormModal
    v-if="showForm"
    :reservation="editingReservation"
    :listings="listings"
    :guests="guests"
    :channels="channels"
    @save="onFormSave"
    @close="showForm = false"
  />

  <GuestEditModal
    v-if="guestEditTarget"
    :guest="guestEditTarget"
    :is-admin="isAdmin"
    @save="handleGuestSave"
    @close="guestEditTarget = null"
  />
</template>
