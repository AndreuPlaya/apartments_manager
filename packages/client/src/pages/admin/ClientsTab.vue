<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ClientItem from '../../components/ClientItem.vue'
import BaseList from '../../components/BaseList.vue'
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

const clientBookingMap = computed(() => {
  const map: Record<string, Booking[]> = {}
  for (const b of allBookings.value) {
    ;(map[b.clientId] ??= []).push(b)
  }
  return map
})

const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M',
                 'N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#']
const selectedLetter = ref('A')
const visibleCount = ref(100)

watch(selectedLetter, () => { visibleCount.value = 100 })

const filtered = computed(() =>
  clients.value.filter(c => {
    const first = c.name?.[0]?.toUpperCase() ?? ''
    if (selectedLetter.value === '#') return !/^[A-Z]/.test(first)
    return first === selectedLetter.value
  })
)

const sorted = computed(() =>
  filtered.value.slice().sort((a, b) => a.name.localeCompare(b.name))
)

const visible = computed(() => sorted.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < sorted.value.length)
</script>

<template>
  <div>
    <div class="page-header">
      <h3>Clients</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add client</button>
    </div>

    <div class="clients-layout">
      <nav class="alpha-sidebar">
        <button
          v-for="l in LETTERS"
          :key="l"
          :class="['alpha-btn', selectedLetter === l && 'alpha-btn--active']"
          @click="selectedLetter = l"
        >{{ l }}</button>
      </nav>

      <div class="clients-main">
        <BaseList :is-empty="sorted.length === 0 && !loading" empty-message="No clients found for this letter.">
          <template #header>
            <th>Name</th>
            <th>ID document</th>
            <th>Email</th>
            <th>Phone</th>
            <th />
          </template>
          <ClientItem
            v-for="c in visible"
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
        </BaseList>

        <div v-if="hasMore" class="load-more-wrap">
          <button class="btn btn--secondary btn--sm" @click="visibleCount += 100">
            Load more ({{ sorted.length - visibleCount }} remaining)
          </button>
        </div>
      </div>
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

<style scoped>
.clients-layout {
  display: flex;
  gap: 0;
  align-items: flex-start;
}

.alpha-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.25rem 0.5rem 0.25rem 0;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
}

.alpha-btn {
  width: 1.75rem;
  height: 1.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.alpha-btn:hover {
  background: var(--border);
  color: var(--text);
}

.alpha-btn--active {
  background: var(--accent);
  color: #fff;
}

.clients-main {
  flex: 1;
  min-width: 0;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}
</style>
