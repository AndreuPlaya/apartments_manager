<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/client'
import type { Apartment, Booking, Client, Channel } from '../../api/client'
import { useToast } from '../../composables/useToast'
import { useAsyncOp } from '../../composables/useAsyncOp'
import CalendarView from './CalendarView.vue'
import BookingFormModal from './BookingFormModal.vue'
import ClientEditModal from '../clients/ClientEditModal.vue'

const { t } = useI18n()
const { success, error } = useToast()
const { run } = useAsyncOp()

// ── Data ──────────────────────────────────────────────────────────────────────

const apartments = ref<Apartment[]>([])
const bookings = ref<Booking[]>([])
const clients = ref<Client[]>([])
const channels = ref<Channel[]>([])
const isAdmin = ref(false)
const pageLoading = ref(true)

function monthsAgo(fromDate: string, months: number): string {
  const d = new Date(fromDate + 'T00:00:00')
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
      api.apartments.list(),
      api.bookings.list({ from: loadFromDate.value }),
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

// ── Booking form ──────────────────────────────────────────────────────────────

const showForm = ref(false)
const editingBooking = ref<Booking | null>(null)

function openCreate() {
  editingBooking.value = null
  showForm.value = true
}


async function onFormSave() {
  showForm.value = false
  await load()
  success(editingBooking.value ? t('bookings.updated') : t('bookings.created'))
}

async function updateBookingDates(id: string, changes: { fromDate?: string; toDate?: string }) {
  const res = await run(() => api.bookings.update(id, changes))
  if (res !== undefined) { await load(); success(t('bookings.updated')) }
}

async function onPatch(id: string, changes: { comment?: string; paidDate?: string }) {
  const res = await run(() => api.bookings.patch(id, changes))
  if (res !== undefined) {
    bookings.value = bookings.value.map((b) => b.id === id ? res : b)
    success(t('bookings.updated'))
  }
}

async function handleUpdate(id: string, payload: Partial<Omit<Booking, 'id' | 'createdAt'>>) {
  const res = await run(() => api.bookings.update(id, payload))
  if (res !== undefined) {
    bookings.value = bookings.value.map((b) => b.id === id ? res : b)
    success(t('bookings.updated'))
  }
}

// ── Client edit ───────────────────────────────────────────────────────────────

const clientEditTarget = ref<Client | null>(null)

function openClient(client: Client) {
  clientEditTarget.value = client
}

async function handleClientSave(client: Client, patch: Partial<Omit<Client, 'id'>>) {
  const res = await run(() => api.clients.update(client.id, patch))
  if (res !== undefined) {
    clients.value = clients.value.map((c) => c.id === client.id ? res : c)
    clientEditTarget.value = null
    success(t('bookings.clientUpdated'))
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('calendar.title') }}</h2>
      <div class="page-header__spacer" />
      <button v-if="isAdmin" class="btn btn--primary btn--sm" @click="openCreate">{{ t('bookings.newBooking') }}</button>
    </div>

    <CalendarView
      :bookings="bookings"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      :is-admin="isAdmin"
      :loading="pageLoading"
      @update="updateBookingDates"
      @patch="onPatch"
    />
  </div>

  <BookingFormModal
    v-if="showForm"
    :booking="editingBooking"
    :apartments="apartments"
    :clients="clients"
    :channels="channels"
    @save="onFormSave"
    @close="showForm = false"
  />

  <ClientEditModal
    v-if="clientEditTarget"
    :client="clientEditTarget"
    :is-admin="isAdmin"
    @save="handleClientSave"
    @close="clientEditTarget = null"
  />
</template>
