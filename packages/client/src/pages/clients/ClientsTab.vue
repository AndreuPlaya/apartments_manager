<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ClientItem from './ClientItem.vue'
import BaseList from '../../shared/BaseList.vue'
import BookingFormModal from '../bookings/BookingFormModal.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()
const props = defineProps<{ isAdmin?: boolean }>()
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
  if (res !== undefined) { showForm.value = false; await load(); success(t('clients.created')) }
}

const deletingId = ref<string | null>(null)

async function del(c: Client) {
  if (!props.isAdmin) return
  if (!(await confirm(t('clients.deleteConfirm', { name: c.name })))) return
  deletingId.value = c.id
  const res = await run(() => api.clients.delete(c.id))
  deletingId.value = null
  if (res !== undefined) { await load(); success(t('clients.deleted')) }
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
      <h3>{{ t('clients.title') }}</h3>
      <div class="page-header__spacer" />
      <button v-if="props.isAdmin" class="btn btn--primary btn--sm" @click="openCreate">{{ t('clients.addClient') }}</button>
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
        <BaseList :is-empty="sorted.length === 0 && !loading" :empty-message="t('clients.noClientsForLetter')">
          <template #header>
            <th>{{ t('clients.nameCol') }}</th>
            <th>{{ t('clients.idDocCol') }}</th>
            <th>{{ t('clients.emailCol') }}</th>
            <th>{{ t('clients.phoneCol') }}</th>
            <th />
          </template>
          <ClientItem
            v-for="c in visible"
            :key="c.id"
            v-memo="[c, clientBookingMap[c.id], apartments, channels, deletingId === c.id, props.isAdmin]"
            :client="c"
            :bookings="clientBookingMap[c.id] ?? []"
            :apartments="apartments"
            :channels="channels"
            :loading="deletingId === c.id"
            :is-admin="props.isAdmin ?? false"
            @update="updateField"
            @delete="del"
            @edit-booking="openBookingEdit"
          />
        </BaseList>

        <div v-if="hasMore" class="load-more-wrap">
          <button class="btn btn--secondary btn--sm" @click="visibleCount += 100">
            {{ t('clients.loadMore', { count: sorted.length - visibleCount }) }}
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
            <h3>{{ t('clients.newClient') }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <TextInput mode="form" :text="t('clients.fullName') + ' *'" v-model="form.name" required />
              <div class="form-row">
                <TextInput mode="form" :text="t('clients.idDocument')" v-model="form.identityDocument" />
                <TextInput mode="form" :text="t('clients.email')" v-model="form.email" type="email" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('clients.phone')" v-model="form.phoneNumber" />
                <TextInput mode="form" :text="t('clients.street')" v-model="form.street" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('clients.city')" v-model="form.city" />
                <TextInput mode="form" :text="t('clients.country')" v-model="form.country" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('clients.zipCode')" v-model="form.zipCode" />
              </div>
              <TextareaInput mode="form" :text="t('clients.comment')" v-model="form.comment" />
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showForm = false">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

