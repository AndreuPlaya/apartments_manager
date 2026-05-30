<script setup lang="ts">
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

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

function updateField(field: keyof Omit<Client, 'id'>, val: string | undefined) {
  emit('update', props.client, { [field]: val })
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

          <TextInput
            text="Full name"
            :model-value="client.name"
            :rights="isAdmin"
            placeholder="Full name"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <TextInput
            text="ID document"
            :model-value="client.identityDocument ?? ''"
            :rights="isAdmin"
            placeholder="ID document"
            @update:model-value="updateField('identityDocument', $event || undefined)"
          />

          <TextInput
            text="Email"
            :model-value="client.email ?? ''"
            :rights="isAdmin"
            type="email"
            placeholder="Email"
            @update:model-value="updateField('email', $event || undefined)"
          />

          <TextInput
            text="Phone"
            :model-value="client.phoneNumber ?? ''"
            :rights="isAdmin"
            placeholder="Phone"
            @update:model-value="updateField('phoneNumber', $event || undefined)"
          />

          <TextInput
            text="City"
            :model-value="client.city ?? ''"
            :rights="isAdmin"
            placeholder="City"
            @update:model-value="updateField('city', $event || undefined)"
          />

          <TextInput
            text="Country"
            :model-value="client.country ?? ''"
            :rights="isAdmin"
            placeholder="Country"
            @update:model-value="updateField('country', $event || undefined)"
          />

          <TextInput
            text="ZIP code"
            :model-value="client.zipCode ?? ''"
            :rights="isAdmin"
            placeholder="ZIP"
            @update:model-value="updateField('zipCode', $event || undefined)"
          />

          <TextInput
            text="Street"
            :model-value="client.street ?? ''"
            :rights="isAdmin"
            placeholder="Street"
            @update:model-value="updateField('street', $event || undefined)"
          />

          <TextareaInput
            text="Comment"
            :model-value="client.comment ?? ''"
            :rights="isAdmin"
            @update:model-value="updateField('comment', $event || undefined)"
          />

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
