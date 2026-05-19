<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Apartment } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import AppIcon from '../../components/AppIcon.vue'
import TrashIcon from '../../components/TrashIcon.vue'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const apartments = ref<Apartment[]>([])
const showForm = ref(false)
const editing = ref<Apartment | null>(null)

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
  editing.value = null
  form.value = blank()
  showForm.value = true
}

function openEdit(a: Apartment) {
  editing.value = a
  form.value = { ...a }
  showForm.value = true
}

async function save() {
  const payload = { ...form.value, floor: Number(form.value.floor), price: Number(form.value.price),
    minNights: Number(form.value.minNights), maxGuests: Number(form.value.maxGuests),
    rooms: Number(form.value.rooms), bathrooms: Number(form.value.bathrooms) }
  let res: unknown
  if (editing.value) {
    res = await run(() => api.apartments.update(editing.value!.id, payload))
  } else {
    res = await run(() => api.apartments.create(payload))
  }
  if (res !== undefined) {
    showForm.value = false
    await load()
    success(editing.value ? 'Apartment updated' : 'Apartment created')
  }
}

async function del(a: Apartment) {
  if (!(await confirm(`Delete apartment "${a.name}"?`))) return
  const res = await run(() => api.apartments.delete(a.id))
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

    <div v-if="apartments.length === 0 && !loading" class="empty-state"><p>No apartments yet.</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Address</th><th>Floor/Door</th>
            <th>Price/night</th><th>Min nights</th><th>Max guests</th>
            <th>Rooms</th><th>Available</th><th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in apartments" :key="a.id">
            <td>{{ a.name }}</td>
            <td>{{ a.address }}</td>
            <td>{{ a.floor }} / {{ a.door }}</td>
            <td>€{{ a.price }}</td>
            <td>{{ a.minNights }}</td>
            <td>{{ a.maxGuests }}</td>
            <td>{{ a.rooms }}</td>
            <td>
              <span :class="['badge', a.isAvailable ? 'badge--active' : 'badge--inactive']">
                {{ a.isAvailable ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn btn--ghost btn--sm" @click="openEdit(a)">Edit</button>
                <button class="btn btn--ghost btn--sm btn--icon text-danger" title="Delete" @click="del(a)"><TrashIcon /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal">
          <div class="modal__header">
            <h3>{{ editing ? 'Edit apartment' : 'New apartment' }}</h3>
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
