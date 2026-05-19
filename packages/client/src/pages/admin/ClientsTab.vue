<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ClientItem from '../../components/ClientItem.vue'
import BookingFormModal from '../main/BookingFormModal.vue'
import AppIcon from '../../components/AppIcon.vue'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const clients = ref<Client[]>([])
const allBookings = ref<Booking[]>([])
const apartments = ref<Apartment[]>([])
const channels = ref<Channel[]>([])
const showForm = ref(false)
const editingBooking = ref<Booking | null>(null)

const blank = (): Omit<Client, 'id'> => ({
  name: '', identityDocument: '', email: '', phoneNumber: '',
  street: '', city: '', country: '', zipCode: '', comment: '',
})
const form = ref(blank())

async function load() {
  const res = await run(() => Promise.all([
    api.clients.list(),
    api.bookings.list(),
    api.apartments.list(),
    api.channels.list(),
  ]))
  if (res) {
    clients.value = res[0]
    allBookings.value = res[1]
    apartments.value = res[2]
    channels.value = res[3]
  }
}

onMounted(load)

function openCreate() { form.value = blank(); showForm.value = true }

async function save() {
  const payload: Omit<Client, 'id'> = {
    name: form.value.name,
    identityDocument: form.value.identityDocument || undefined,
    email: form.value.email || undefined,
    phoneNumber: form.value.phoneNumber || undefined,
    street: form.value.street || undefined,
    city: form.value.city || undefined,
    country: form.value.country || undefined,
    zipCode: form.value.zipCode || undefined,
    comment: form.value.comment || undefined,
  }
  const res = await run(() => api.clients.create(payload))
  if (res !== undefined) { showForm.value = false; await load(); success('Client created') }
}

const deletingId = ref<string | null>(null)

async function del(c: Client) {
  if (!(await confirm(`Delete client "${c.name}"?`))) return
  deletingId.value = c.id
  const res = await run(() => api.clients.delete(c.id))
  deletingId.value = null
  if (res !== undefined) { await load(); success('Client deleted') }
}

async function updateField(c: Client, patch: Partial<Omit<Client, 'id'>>) {
  const res = await run(() => api.clients.update(c.id, patch))
  if (res !== undefined) {
    const idx = clients.value.findIndex(x => x.id === c.id)
    if (idx !== -1) clients.value[idx] = { ...clients.value[idx], ...patch }
  }
}

function openBookingEdit(b: Booking) { editingBooking.value = b }

async function onBookingSaved() {
  editingBooking.value = null
  await load()
}

const searchRaw = ref('')
const search = ref('')
let _searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchRaw, (val) => {
  clearTimeout(_searchTimer)
  _searchTimer = setTimeout(() => { search.value = val }, 150)
})

const clientBookingMap = computed(() => {
  const map: Record<string, Booking[]> = {}
  for (const b of allBookings.value) {
    ;(map[b.clientId] ??= []).push(b)
  }
  return map
})

const sortKey = ref<keyof Client>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: keyof Client) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return clients.value
  return clients.value.filter((c) => c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q))
})

const sorted = computed(() => {
  const list = filtered.value.slice()
  const key = sortKey.value
  const dir = sortDir.value
  return list.sort((a, b) =>
    String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (dir === 'asc' ? 1 : -1)
  )
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>Clients</h3>
      <div class="page-header__spacer" />
      <input v-model="searchRaw" type="text" placeholder="Search…" style="max-width: 200px" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add client</button>
    </div>

    <div v-if="sorted.length === 0 && !loading" class="empty-state"><p>No clients found.</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="sortable-th" @click="toggleSort('name')">
              Name
              <AppIcon :name="sortKey === 'name' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'" :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'name' }" />
            </th>
            <th class="sortable-th" @click="toggleSort('identityDocument')">
              ID document
              <AppIcon :name="sortKey === 'identityDocument' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'" :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'identityDocument' }" />
            </th>
            <th class="sortable-th" @click="toggleSort('email')">
              Email
              <AppIcon :name="sortKey === 'email' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'" :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'email' }" />
            </th>
            <th class="sortable-th" @click="toggleSort('phoneNumber')">
              Phone
              <AppIcon :name="sortKey === 'phoneNumber' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevron-up-down'" :size="10" class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'phoneNumber' }" />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <ClientItem
            v-for="c in sorted"
            :key="c.id"
            v-memo="[c, clientBookingMap[c.id], apartments, channels, deletingId === c.id]"
            :client="c"
            :bookings="clientBookingMap[c.id] ?? []"
            :apartments="apartments"
            :channels="channels"
            :loading="deletingId === c.id"
            @update="updateField"
            @delete="del"
            @edit-booking="openBookingEdit"
          />
        </tbody>
      </table>
    </div>

    <BookingFormModal
      v-if="editingBooking"
      :booking="editingBooking"
      :apartments="apartments"
      :clients="clients"
      :channels="channels"
      @save="onBookingSaved"
      @close="editingBooking = null"
    />

    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--lg">
          <div class="modal__header">
            <h3>New client</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <div class="form-group">
                <label>Full name *</label>
                <input v-model="form.name" type="text" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>ID document</label>
                  <input v-model="form.identityDocument" type="text" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="form.email" type="email" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input v-model="form.phoneNumber" type="text" />
                </div>
                <div class="form-group">
                  <label>Street</label>
                  <input v-model="form.street" type="text" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>City</label>
                  <input v-model="form.city" type="text" />
                </div>
                <div class="form-group">
                  <label>Country</label>
                  <input v-model="form.country" type="text" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>ZIP code</label>
                  <input v-model="form.zipCode" type="text" />
                </div>
              </div>
              <div class="form-group">
                <label>Comment</label>
                <textarea v-model="form.comment" rows="2" />
              </div>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
