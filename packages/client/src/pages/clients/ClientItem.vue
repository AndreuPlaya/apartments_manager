<script setup lang="ts">
import { ref } from 'vue'
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import BaseItem from '../../shared/BaseItem.vue'


const props = defineProps<{
  client: Client
  bookings: Booking[]
  apartments: Apartment[]
  channels: Channel[]
  loading: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [client: Client, patch: Partial<Omit<Client, 'id'>>]
  delete: [client: Client]
  editBooking: [booking: Booking]
}>()

type ClientField = keyof Omit<Client, 'id'>

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const { editingField, editingValue, startEdit, cancelEdit } = useInlineEdit<ClientField>(inputRef)

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null
  const val = editingValue.value.trim()
  const current = String(props.client[field as keyof Client] ?? '')
  if (val === current) return
  emit('update', props.client, { [field]: val || undefined })
}

function apartmentName(id: string) {
  return props.apartments.find(a => a.id === id)?.name ?? id
}

const statusClass: Record<string, string> = {
  Active: 'badge--active',
  Cancelled: 'badge--cancelled',
}

const statusLabel: Record<string, string> = {
  Active: 'Active',
  Cancelled: 'Cancelled',
}
</script>

<template>
  <BaseItem
    :col-span="5"
    :loading="loading"
    :can-delete="(props.isAdmin ?? false) && bookings.length === 0"
    @delete="emit('delete', client)"
  >
    <template #summary>
      <td><span class="cell-val">{{ client.name || '—' }}</span></td>
      <td><span class="cell-val">{{ client.identityDocument ?? '—' }}</span></td>
      <td><span class="cell-val">{{ client.email ?? '—' }}</span></td>
      <td><span class="cell-val">{{ client.phoneNumber ?? '—' }}</span></td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">Details</span>
        <div class="details-grid">

          <div :class="['detail-field', editingField === 'name' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('name', client.name)">
            <span class="detail-field__label">Full name</span>
            <span v-if="editingField !== 'name'" class="detail-field__val">{{ client.name || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Full name"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'identityDocument' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('identityDocument', client.identityDocument ?? '')">
            <span class="detail-field__label">ID document</span>
            <span v-if="editingField !== 'identityDocument'" class="detail-field__val">{{ client.identityDocument || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="ID document"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'email' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('email', client.email ?? '')">
            <span class="detail-field__label">Email</span>
            <span v-if="editingField !== 'email'" class="detail-field__val">{{ client.email || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="email" placeholder="Email"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'phoneNumber' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('phoneNumber', client.phoneNumber ?? '')">
            <span class="detail-field__label">Phone</span>
            <span v-if="editingField !== 'phoneNumber'" class="detail-field__val">{{ client.phoneNumber || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Phone"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'city' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('city', client.city ?? '')">
            <span class="detail-field__label">City</span>
            <span v-if="editingField !== 'city'" class="detail-field__val">{{ client.city || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="City"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'country' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('country', client.country ?? '')">
            <span class="detail-field__label">Country</span>
            <span v-if="editingField !== 'country'" class="detail-field__val">{{ client.country || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Country"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'zipCode' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('zipCode', client.zipCode ?? '')">
            <span class="detail-field__label">ZIP code</span>
            <span v-if="editingField !== 'zipCode'" class="detail-field__val">{{ client.zipCode || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="ZIP"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'street' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('street', client.street ?? '')">
            <span class="detail-field__label">Street</span>
            <span v-if="editingField !== 'street'" class="detail-field__val">{{ client.street || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Street"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', 'detail-field--wide', editingField === 'comment' && 'detail-field--editing']"
            @click="props.isAdmin && startEdit('comment', client.comment ?? '')">
            <span class="detail-field__label">Comment</span>
            <span v-if="editingField !== 'comment'" class="detail-field__val detail-field__val--pre">{{ client.comment || '—' }}</span>
            <textarea v-else ref="inputRef" v-model="editingValue" rows="2" placeholder="Comment"
              @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

        </div>
      </div>

      <div v-if="bookings.length > 0" class="bookings-panel">
        <span class="panel-label">Bookings</span>
        <table class="sub-table">
          <thead>
            <tr>
              <th>From</th><th>To</th><th>Apartment</th><th>Status</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id" class="booking-row" :class="{ 'booking-row--readonly': !props.isAdmin }" @click="props.isAdmin && emit('editBooking', b)">
              <td>{{ b.fromDate }}</td>
              <td>{{ b.toDate }}</td>
              <td>{{ apartmentName(b.apartmentId) }}</td>
              <td><span :class="['badge', statusClass[b.status]]">{{ statusLabel[b.status] }}</span></td>
              <td>{{ b.totalAmountDue }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </BaseItem>
</template>

<style scoped>
.cell-val { display: block; }

.bookings-panel {
  padding: 0.75rem 0.875rem 0;
  background: var(--card);
  border-left: 3px solid var(--border-dark);
}

.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  margin-bottom: 0;
}

.sub-table th,
.sub-table td {
  padding: 0.4rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.sub-table thead th {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: transparent;
}

.sub-table tbody tr:last-child td { border-bottom: none; }

.booking-row { cursor: pointer; }
.booking-row:hover td { background: var(--accent-light) !important; }
.booking-row--readonly { cursor: default; }
.booking-row--readonly:hover td { background: transparent !important; }
</style>
