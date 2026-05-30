<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Client, Booking, Apartment, Channel } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()

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

const statusLabel = computed<Record<string, string>>(() => ({
  Active: t('bookings.statusActive'),
  Cancelled: t('bookings.statusCancelled'),
}))
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
        <span class="panel-label">{{ t('clients.detailsPanel') }}</span>
        <div class="details-grid">

          <TextInput
            :text="t('clients.fullName')"
            :model-value="client.name"
            :rights="isAdmin"
            :placeholder="t('clients.fullName')"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <TextInput
            :text="t('clients.idDocument')"
            :model-value="client.identityDocument ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.idDocument')"
            @update:model-value="updateField('identityDocument', $event || undefined)"
          />

          <TextInput
            :text="t('clients.email')"
            :model-value="client.email ?? ''"
            :rights="isAdmin"
            type="email"
            :placeholder="t('clients.email')"
            @update:model-value="updateField('email', $event || undefined)"
          />

          <TextInput
            :text="t('clients.phone')"
            :model-value="client.phoneNumber ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.phone')"
            @update:model-value="updateField('phoneNumber', $event || undefined)"
          />

          <TextInput
            :text="t('clients.city')"
            :model-value="client.city ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.city')"
            @update:model-value="updateField('city', $event || undefined)"
          />

          <TextInput
            :text="t('clients.country')"
            :model-value="client.country ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.country')"
            @update:model-value="updateField('country', $event || undefined)"
          />

          <TextInput
            :text="t('clients.zipCode')"
            :model-value="client.zipCode ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.zipCode')"
            @update:model-value="updateField('zipCode', $event || undefined)"
          />

          <TextInput
            :text="t('clients.street')"
            :model-value="client.street ?? ''"
            :rights="isAdmin"
            :placeholder="t('clients.street')"
            @update:model-value="updateField('street', $event || undefined)"
          />

          <TextareaInput
            :text="t('clients.comment')"
            :model-value="client.comment ?? ''"
            :rights="isAdmin"
            @update:model-value="updateField('comment', $event || undefined)"
          />

        </div>
      </div>

      <div v-if="bookings.length > 0" class="bookings-panel">
        <span class="panel-label">{{ t('clients.bookingsPanel') }}</span>
        <table class="sub-table">
          <thead>
            <tr>
              <th>{{ t('clients.fromCol') }}</th>
              <th>{{ t('clients.toCol') }}</th>
              <th>{{ t('clients.apartmentCol') }}</th>
              <th>{{ t('clients.statusCol') }}</th>
              <th>{{ t('clients.amountCol') }}</th>
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
