<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Booking, Apartment, Client, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import ClientSearchInput, { type NewClientData } from '../clients/ClientSearchInput.vue'
import AppIcon from '../../shared/AppIcon.vue'
import SelectInput from '../../shared/fields/SelectInput.vue'
import DateInput from '../../shared/fields/DateInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

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
  cribRequested: false,
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
        cribRequested: b.cribRequested ?? false,
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
    cribRequested: form.value.cribRequested,
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

const apartmentOptions = props.apartments.map(a => ({ value: a.id, label: a.name }))
const activeChannelOptions = props.channels.filter(c => c.isActive).map(c => ({ value: c.id, label: c.name }))
const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Cancelled', label: 'Cancelled' },
]
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
              <SelectInput mode="form" text="Apartment *" v-model="form.apartmentId" :options="apartmentOptions" placeholder="Select…" required />
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
              <DateInput mode="form" text="Check-in *" v-model="form.fromDate" required />
              <DateInput mode="form" text="Check-out *" v-model="form.toDate" required />
            </div>
            <div class="form-row">
              <NumberInput mode="form" text="Adults *" v-model="form.adultCount" :min="1" required />
              <NumberInput mode="form" text="Children" v-model="form.childrenCount" :min="0" />
            </div>
            <div v-if="Number(form.childrenCount) > 0" class="form-row">
              <CheckboxInput mode="form" text="Crib requested" v-model="form.cribRequested" />
            </div>
            <div class="form-row">
              <SelectInput mode="form" text="Channel *" v-model="form.channelId" :options="activeChannelOptions" placeholder="Select…" required />
              <SelectInput mode="form" text="Status" v-model="form.status" :options="statusOptions" />
              <DateInput mode="form" text="Paid date" v-model="form.paidDate" />
            </div>
            <NumberInput mode="form" text="Total amount due (€) *" v-model="form.totalAmountDue" :min="0" :step="0.01" required />
            <TextareaInput mode="form" text="Comment" v-model="form.comment" />
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
