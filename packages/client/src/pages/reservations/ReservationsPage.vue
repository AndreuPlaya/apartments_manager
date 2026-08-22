<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/client'
import type { Listing, Reservation, Guest, Channel } from '../../api/client'
import { useToast } from '../../composables/useToast'
import { useAsyncOp } from '../../composables/useAsyncOp'
import ReservationListView from './ReservationListView.vue'
import ReservationFormModal from './ReservationFormModal.vue'
import GuestEditModal from '../guests/GuestEditModal.vue'
import type { ReservationStatus } from '../../api/client'

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
const loadingMore = ref(false)

const today = new Date().toISOString().split('T')[0] ?? ''

function monthsAgo(checkIn: string, months: number): string {
  const d = new Date(checkIn + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]!
}

const loadFromDate = ref(monthsAgo(new Date().toISOString().split('T')[0]!, 2))

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
    if (e instanceof Error) error(e.message)
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

async function onPatch(id: string, changes: { comment?: string; status?: ReservationStatus; paidDate?: string }) {
  const res = await run(() => api.reservations.patch(id, changes))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

/**
 * A lifecycle move. It goes through the same patch endpoint as a comment, but is
 * kept a separate handler so the failure reads as a refused transition rather
 * than a failed save — the server's message names the legal moves.
 */
async function onTransition(id: string, status: ReservationStatus) {
  await onPatch(id, { status })
}

async function handleUpdate(id: string, payload: Partial<Omit<Reservation, 'id' | 'createdAt'>>) {
  const res = await run(() => api.reservations.update(id, payload))
  if (res !== undefined) {
    reservations.value = reservations.value.map((b) => b.id === id ? res : b)
    success(t('reservations.updated'))
  }
}

async function deleteReservation(b: Reservation) {
  const res = await run(() => api.reservations.delete(b.id))
  if (res !== undefined) { await load(); success(t('reservations.deleted')) }
}

async function handleLoadMore() {
  loadingMore.value = true
  try {
    loadFromDate.value = monthsAgo(loadFromDate.value, 1)
    const bks = await api.reservations.list({ from: loadFromDate.value })
    reservations.value = bks
  } catch (e) {
    if (e instanceof Error) error(e.message)
  } finally {
    loadingMore.value = false
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
      <h2>{{ t('reservations.title') }}</h2>
      <div class="page-header__spacer" />
      <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">{{ t('reservations.newReservation') }}</button>
    </div>

    <ReservationListView
      :reservations="reservations"
      :listings="listings"
      :guests="guests"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      :loading-more="loadingMore"
      :today="today"
      @update="handleUpdate"
      @patch="onPatch"
      @transition="onTransition"
      @delete="deleteReservation"
      @open-guest="openGuest"
      @load-more="handleLoadMore"
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
