<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Apartment, Channel, CalendarLink } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ApartmentItem from './ApartmentItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const props = defineProps<{ isAdmin?: boolean }>()

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const apartments = ref<Apartment[]>([])
const channels = ref<Channel[]>([])
const calendarLinks = ref<CalendarLink[]>([])
const showForm = ref(false)

const blank = (): Omit<Apartment, 'id'> => ({
  name: '', address: '', floor: 0, door: '', price: 0, minNights: 1,
  maxGuests: 2, rooms: 1, bathrooms: 1, isAvailable: true, description: '',
})
const form = ref(blank())

async function load() {
  const [apt, ch, links] = await Promise.all([
    run(() => api.apartments.list()),
    run(() => api.channels.list()),
    run(() => api.calendarLinks.list()),
  ])
  if (apt) apartments.value = apt
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
    price: Number(form.value.price),
    minNights: Number(form.value.minNights),
    maxGuests: Number(form.value.maxGuests),
    rooms: Number(form.value.rooms),
    bathrooms: Number(form.value.bathrooms),
  }
  const res = await run(() => api.apartments.create(payload))
  if (res !== undefined) {
    showForm.value = false
    await load()
    success('Apartment created')
  }
}

async function updateField(apt: Apartment, patch: Partial<Omit<Apartment, 'id'>>) {
  const res = await run(() => api.apartments.update(apt.id, patch))
  if (res !== undefined) {
    const idx = apartments.value.findIndex(a => a.id === apt.id)
    if (idx !== -1) apartments.value[idx] = { ...apartments.value[idx], ...patch }
  }
}

async function del(apt: Apartment) {
  if (!(await confirm(`Delete apartment "${apt.name}"?`))) return
  const res = await run(() => api.apartments.delete(apt.id))
  if (res !== undefined) { await load(); success('Apartment deleted') }
}

async function saveCalendarLink(channelId: string, apartmentId: string, url: string) {
  const res = await run(() => api.calendarLinks.upsert({ channelId, apartmentId, url }))
  if (res !== undefined) {
    const idx = calendarLinks.value.findIndex(
      l => l.channelId === channelId && l.apartmentId === apartmentId
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
      <h3>Apartments</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add apartment</button>
    </div>

    <BaseList :is-empty="apartments.length === 0 && !loading" empty-message="No apartments yet.">
      <template #header>
        <th>Name</th>
        <th>Address</th>
        <th>Floor / Door</th>
        <th>Price / night</th>
        <th>Available</th>
        <th />
      </template>
      <ApartmentItem
        v-for="a in apartments"
        :key="a.id"
        :apartment="a"
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
            <h3>New apartment</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <TextInput mode="form" text="Name *" v-model="form.name" required />
              <TextInput mode="form" text="Address *" v-model="form.address" required />
              <div class="form-row">
                <NumberInput mode="form" text="Floor" v-model="form.floor" />
                <TextInput mode="form" text="Door *" v-model="form.door" required />
              </div>
              <div class="form-row">
                <NumberInput mode="form" text="Price / night (€) *" v-model="form.price" :min="0" :step="0.01" required />
                <NumberInput mode="form" text="Min nights" v-model="form.minNights" :min="1" />
              </div>
              <div class="form-row">
                <NumberInput mode="form" text="Max guests" v-model="form.maxGuests" :min="1" />
                <NumberInput mode="form" text="Rooms" v-model="form.rooms" :min="1" />
              </div>
              <div class="form-row">
                <NumberInput mode="form" text="Bathrooms" v-model="form.bathrooms" :min="1" />
              </div>
              <CheckboxInput mode="form" text="Available for booking" v-model="form.isAvailable" />
              <TextareaInput mode="form" text="Description" v-model="form.description" />
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
