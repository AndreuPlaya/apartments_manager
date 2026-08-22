<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Guest, Reservation, Listing, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import GuestItem from './GuestItem.vue'
import BaseList from '../../shared/BaseList.vue'
import ReservationFormModal from '../reservations/ReservationFormModal.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()
const props = defineProps<{ isAdmin?: boolean }>()
const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const guests = ref<Guest[]>([])
const allReservations = ref<Reservation[]>([])
const listings = ref<Listing[]>([])
const channels = ref<Channel[]>([])
const showForm = ref(false)
const editingReservation = ref<Reservation | null>(null)

const blank = (): Omit<Guest, 'id'> => ({
  name: '', identityDocument: '', email: '', phoneNumber: '',
  street: '', city: '', country: '', zipCode: '', comment: '',
})
const form = ref(blank())

async function load() {
  const res = await run(() => Promise.all([
    api.guests.list(),
    api.reservations.list(),
    api.listings.list(),
    api.channels.list(),
  ]))
  if (res) {
    guests.value = res[0]
    allReservations.value = res[1]
    listings.value = res[2]
    channels.value = res[3]
  }
}

onMounted(load)

function openCreate() { form.value = blank(); showForm.value = true }

async function save() {
  const payload: Omit<Guest, 'id'> = {
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
  const res = await run(() => api.guests.create(payload))
  if (res !== undefined) { showForm.value = false; await load(); success(t('guests.created')) }
}

const deletingId = ref<string | null>(null)

async function del(c: Guest) {
  if (!props.isAdmin) return
  if (!(await confirm(t('guests.deleteConfirm', { name: c.name })))) return
  deletingId.value = c.id
  const res = await run(() => api.guests.delete(c.id))
  deletingId.value = null
  if (res !== undefined) { await load(); success(t('guests.deleted')) }
}

async function updateField(c: Guest, patch: Partial<Omit<Guest, 'id'>>) {
  const res = await run(() => api.guests.update(c.id, patch))
  if (res !== undefined) {
    const idx = guests.value.findIndex(x => x.id === c.id)
    if (idx !== -1) guests.value[idx] = { ...guests.value[idx], ...patch }
  }
}

function openReservationEdit(b: Reservation) { editingReservation.value = b }

async function onReservationSaved() {
  editingReservation.value = null
  await load()
}

const guestReservationMap = computed(() => {
  const map: Record<string, Reservation[]> = {}
  for (const b of allReservations.value) {
    ;(map[b.guestId] ??= []).push(b)
  }
  return map
})

const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M',
                 'N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#']
const selectedLetter = ref('A')
const visibleCount = ref(100)

watch(selectedLetter, () => { visibleCount.value = 100 })

const filtered = computed(() =>
  guests.value.filter(c => {
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
      <h3>{{ t('guests.title') }}</h3>
      <div class="page-header__spacer" />
      <button v-if="props.isAdmin" class="btn btn--primary btn--sm" @click="openCreate">{{ t('guests.addGuest') }}</button>
    </div>

    <div class="guests-layout">
      <nav class="alpha-sidebar">
        <button
          v-for="l in LETTERS"
          :key="l"
          :class="['alpha-btn', selectedLetter === l && 'alpha-btn--active']"
          @click="selectedLetter = l"
        >{{ l }}</button>
      </nav>

      <div class="guests-main">
        <BaseList :is-empty="sorted.length === 0 && !loading" :empty-message="t('guests.noGuestsForLetter')">
          <template #header>
            <th>{{ t('guests.nameCol') }}</th>
            <th>{{ t('guests.idDocCol') }}</th>
            <th>{{ t('guests.emailCol') }}</th>
            <th>{{ t('guests.phoneCol') }}</th>
            <th />
          </template>
          <GuestItem
            v-for="c in visible"
            :key="c.id"
            v-memo="[c, guestReservationMap[c.id], listings, channels, deletingId === c.id, props.isAdmin]"
            :guest="c"
            :reservations="guestReservationMap[c.id] ?? []"
            :listings="listings"
            :channels="channels"
            :loading="deletingId === c.id"
            :is-admin="props.isAdmin ?? false"
            @update="updateField"
            @delete="del"
            @edit-reservation="openReservationEdit"
          />
        </BaseList>

        <div v-if="hasMore" class="load-more-wrap">
          <button class="btn btn--secondary btn--sm" @click="visibleCount += 100">
            {{ t('guests.loadMore', { count: sorted.length - visibleCount }) }}
          </button>
        </div>
      </div>
    </div>

    <ReservationFormModal
      v-if="editingReservation"
      :reservation="editingReservation"
      :listings="listings"
      :guests="guests"
      :channels="channels"
      @save="onReservationSaved"
      @close="editingReservation = null"
    />

    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--lg">
          <div class="modal__header">
            <h3>{{ t('guests.newGuest') }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <TextInput mode="form" :text="t('guests.fullName') + ' *'" v-model="form.name" required />
              <div class="form-row">
                <TextInput mode="form" :text="t('guests.idDocument')" v-model="form.identityDocument" />
                <TextInput mode="form" :text="t('guests.email')" v-model="form.email" type="email" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('guests.phone')" v-model="form.phoneNumber" />
                <TextInput mode="form" :text="t('guests.street')" v-model="form.street" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('guests.city')" v-model="form.city" />
                <TextInput mode="form" :text="t('guests.country')" v-model="form.country" />
              </div>
              <div class="form-row">
                <TextInput mode="form" :text="t('guests.zipCode')" v-model="form.zipCode" />
              </div>
              <TextareaInput mode="form" :text="t('guests.comment')" v-model="form.comment" />
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

