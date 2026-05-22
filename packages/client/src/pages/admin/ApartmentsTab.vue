<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Apartment } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ApartmentItem from '../../components/ApartmentItem.vue'
import BaseList from '../../components/BaseList.vue'
import AppIcon from '../../components/AppIcon.vue'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const apartments = ref<Apartment[]>([])
const showForm = ref(false)

const blank = (): Omit<Apartment, 'id'> => ({
  name: '', address: '', floor: 0, door: '', price: 0, minNights: 1,
  maxGuests: 2, rooms: 1, bathrooms: 1, isAvailable: true, description: '',
})
const form = ref(blank())

async function load() {
  const res = await run(() => api.apartments.list())
  if (res) apartments.value = res
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
        :loading="loading"
        @update="updateField"
        @delete="del"
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
              <div class="form-group">
                <label>Name *</label>
                <input v-model="form.name" type="text" required />
              </div>
              <div class="form-group">
                <label>Address *</label>
                <input v-model="form.address" type="text" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Floor</label>
                  <input v-model="form.floor" type="number" />
                </div>
                <div class="form-group">
                  <label>Door *</label>
                  <input v-model="form.door" type="text" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Price / night (€) *</label>
                  <input v-model="form.price" type="number" min="0" step="0.01" required />
                </div>
                <div class="form-group">
                  <label>Min nights</label>
                  <input v-model="form.minNights" type="number" min="1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Max guests</label>
                  <input v-model="form.maxGuests" type="number" min="1" />
                </div>
                <div class="form-group">
                  <label>Rooms</label>
                  <input v-model="form.rooms" type="number" min="1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Bathrooms</label>
                  <input v-model="form.bathrooms" type="number" min="1" />
                </div>
              </div>
              <label class="checkbox-row">
                <input v-model="form.isAvailable" type="checkbox" />
                Available for booking
              </label>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="form.description" rows="2" />
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
