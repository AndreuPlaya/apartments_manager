<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import ClientSearchInput, { type NewClientData } from '../clients/ClientSearchInput.vue'
import AppIcon from '../../shared/AppIcon.vue'

const props = defineProps<{
  booking: Booking | null
  apartments: Apartment[]
  clients: Client[]
  channels: Channel[]
}>()

const emit = defineEmits<{
  save: []
  close: []
}>()

const { loading, run } = useAsyncOp()

const form = ref({
  apartmentId: '',
  clientId: '',
  channelId: '',
  fromDate: '',
  toDate: '',
  adultCount: 1,
  childrenCount: 0,
  status: 'Active' as 'Active' | 'Cancelled',
  paidDate: '',
  totalAmountDue: 0,
  comment: '',
  newClientData: null as NewClientData | null,
})

watch(
  () => props.booking,
  (b) => {
    if (b) {
      form.value = {
        apartmentId: b.apartmentId,
        clientId: b.clientId,
        channelId: b.channelId,
        fromDate: b.fromDate,
        toDate: b.toDate,
        adultCount: b.adultCount,
        childrenCount: b.childrenCount,
        status: b.status,
        paidDate: b.paidDate ?? '',
        totalAmountDue: b.totalAmountDue,
        comment: b.comment ?? '',
        newClientData: null,
      }
    }
  },
  { immediate: true },
)

async function save() {
  let clientId = form.value.clientId

  if (!clientId && form.value.newClientData) {
    const nd = form.value.newClientData
    const created = await run(() =>
      api.clients.create({
        name: nd.name,
        email: nd.email || undefined,
        phoneNumber: nd.phoneNumber || undefined,
        identityDocument: nd.identityDocument || undefined,
      }),
    )
    if (!created) return
    clientId = created.id
  }

  const payload = {
    apartmentId: form.value.apartmentId,
    clientId,
    channelId: form.value.channelId,
    fromDate: form.value.fromDate,
    toDate: form.value.toDate,
    adultCount: Number(form.value.adultCount),
    childrenCount: Number(form.value.childrenCount),
    status: form.value.status,
    paidDate: form.value.paidDate || undefined,
    totalAmountDue: Number(form.value.totalAmountDue),
    comment: form.value.comment || undefined,
  }

  let res: unknown
  if (props.booking) {
    res = await run(() => api.bookings.update(props.booking!.id, payload))
  } else {
    res = await run(() => api.bookings.create(payload))
  }
  if (res !== undefined) emit('save')
}

const activeChannels = props.channels.filter((c) => c.isActive)
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal modal--lg">
        <div class="modal__header">
          <h3>{{ booking ? 'Edit booking' : 'New booking' }}</h3>
          <button class="btn btn--ghost btn--sm" @click="emit('close')"><AppIcon name="x" /></button>
        </div>
        <form @submit.prevent="save">
          <div class="modal__body">
            <div class="form-row">
              <div class="form-group">
                <label>Apartment *</label>
                <select v-model="form.apartmentId" required>
                  <option value="">Select…</option>
                  <option v-for="a in apartments" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Client *</label>
                <ClientSearchInput
                  :clients="clients"
                  v-model="form.clientId"
                  v-model:newClient="form.newClientData"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Check-in *</label>
                <input v-model="form.fromDate" type="date" required />
              </div>
              <div class="form-group">
                <label>Check-out *</label>
                <input v-model="form.toDate" type="date" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Adults *</label>
                <input v-model="form.adultCount" type="number" min="1" required />
              </div>
              <div class="form-group">
                <label>Children</label>
                <input v-model="form.childrenCount" type="number" min="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Channel *</label>
                <select v-model="form.channelId" required>
                  <option value="">Select…</option>
                  <option v-for="c in activeChannels" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div class="form-group">
                <label>Paid date</label>
                <input v-model="form.paidDate" type="date" />
              </div>
            </div>
            <div class="form-group">
              <label>Total amount due (€) *</label>
              <input v-model="form.totalAmountDue" type="number" min="0" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Comment</label>
              <textarea v-model="form.comment" rows="2" />
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="emit('close')">Cancel</button>
            <button type="submit" class="btn btn--primary" :disabled="loading">
              {{ loading ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
