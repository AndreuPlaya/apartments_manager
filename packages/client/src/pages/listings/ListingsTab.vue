<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Listing, Channel, CalendarLink } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ListingItem from './ListingItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CurrencyInput from '../../shared/fields/CurrencyInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()
const props = defineProps<{ isAdmin?: boolean }>()

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const listings = ref<Listing[]>([])
const channels = ref<Channel[]>([])
const calendarLinks = ref<CalendarLink[]>([])
const showForm = ref(false)

const blank = (): Omit<Listing, 'id'> => ({
  name: '', address: '', floor: 0, door: '', nightlyRate: 0, minNights: 1,
  maxGuests: 2, rooms: 1, bathrooms: 1, isActive: true, description: '',
})
const form = ref(blank())

async function load() {
  const [apt, ch, links] = await Promise.all([
    run(() => api.listings.list()),
    run(() => api.channels.list()),
    run(() => api.calendarLinks.list()),
  ])
  if (apt) listings.value = apt
  if (ch) channels.value = ch
  if (links) calendarLinks.value = links
}

onMounted(load)

function openCreate() {
  form.value = blank()
  showForm.value = true
}

async function save() {
  const payload = {
    ...form.value,
    floor: Number(form.value.floor),
    nightlyRate: Number(form.value.nightlyRate),
    minNights: Number(form.value.minNights),
    maxGuests: Number(form.value.maxGuests),
    rooms: Number(form.value.rooms),
    bathrooms: Number(form.value.bathrooms),
  }
  const res = await run(() => api.listings.create(payload))
  if (res !== undefined) {
    showForm.value = false
    await load()
    success(t('listings.created'))
  }
}

async function updateField(apt: Listing, patch: Partial<Omit<Listing, 'id'>>) {
  const res = await run(() => api.listings.update(apt.id, patch))
  if (res !== undefined) {
    const idx = listings.value.findIndex(a => a.id === apt.id)
    if (idx !== -1) listings.value[idx] = { ...listings.value[idx], ...patch }
  }
}

async function del(apt: Listing) {
  if (!(await confirm(t('listings.deleteConfirm', { name: apt.name })))) return
  const res = await run(() => api.listings.delete(apt.id))
  if (res !== undefined) { await load(); success(t('listings.deleted')) }
}

async function saveCalendarLink(channelId: string, listingId: string, url: string) {
  const res = await run(() => api.calendarLinks.upsert({ channelId, listingId, url }))
  if (res !== undefined) {
    const idx = calendarLinks.value.findIndex(
      l => l.channelId === channelId && l.listingId === listingId
    )
    if (idx !== -1) {
      calendarLinks.value[idx] = res
    } else {
      calendarLinks.value = [...calendarLinks.value, res]
    }
  }
}

async function deleteCalendarLink(id: string) {
  const res = await run(() => api.calendarLinks.delete(id))
  if (res !== undefined) {
    calendarLinks.value = calendarLinks.value.filter(l => l.id !== id)
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h3>{{ t('listings.title') }}</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">{{ t('listings.addListing') }}</button>
    </div>

    <BaseList :is-empty="listings.length === 0 && !loading" :empty-message="t('listings.noListings')">
      <template #header>
        <th>{{ t('listings.nameCol') }}</th>
        <th>{{ t('listings.addressCol') }}</th>
        <th>{{ t('listings.floorDoorCol') }}</th>
        <th>{{ t('listings.nightlyRateCol') }}</th>
        <th>{{ t('listings.activeCol') }}</th>
        <th />
      </template>
      <ListingItem
        v-for="a in listings"
        :key="a.id"
        :listing="a"
        :calendar-links="calendarLinks"
        :channels="channels"
        :loading="loading"
        :is-admin="props.isAdmin"
        @update="updateField"
        @delete="del"
        @save-calendar-link="saveCalendarLink"
        @delete-calendar-link="deleteCalendarLink"
      />
    </BaseList>

    <!-- Create modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal">
          <div class="modal__header">
            <h3>{{ t('listings.newListing') }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <TextInput mode="form" :text="t('listings.name') + ' *'" v-model="form.name" required />
              <TextInput mode="form" :text="t('listings.address') + ' *'" v-model="form.address" required />
              <div class="form-row">
                <NumberInput mode="form" :text="t('listings.floor')" v-model="form.floor" />
                <TextInput mode="form" :text="t('listings.door') + ' *'" v-model="form.door" required />
              </div>
              <div class="form-row">
                <CurrencyInput mode="form" :text="t('listings.nightlyRate') + ' *'" v-model="form.nightlyRate" :min="0" required />
                <NumberInput mode="form" :text="t('listings.minNights')" v-model="form.minNights" :min="1" />
              </div>
              <div class="form-row">
                <NumberInput mode="form" :text="t('listings.maxGuests')" v-model="form.maxGuests" :min="1" />
                <NumberInput mode="form" :text="t('listings.rooms')" v-model="form.rooms" :min="1" />
              </div>
              <div class="form-row">
                <NumberInput mode="form" :text="t('listings.bathrooms')" v-model="form.bathrooms" :min="1" />
              </div>
              <CheckboxInput mode="form" :text="t('listings.activeForReservations')" v-model="form.isActive" />
              <TextareaInput mode="form" :text="t('listings.description')" v-model="form.description" />
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
