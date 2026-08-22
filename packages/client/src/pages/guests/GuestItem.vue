<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Guest, Reservation, Listing, Channel } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()

const props = defineProps<{
  guest: Guest
  reservations: Reservation[]
  listings: Listing[]
  channels: Channel[]
  loading: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [guest: Guest, patch: Partial<Omit<Guest, 'id'>>]
  delete: [guest: Guest]
  editReservation: [reservation: Reservation]
}>()

function updateField(field: keyof Omit<Guest, 'id'>, val: string | undefined) {
  emit('update', props.guest, { [field]: val })
}

function listingName(id: string) {
  return props.listings.find(a => a.id === id)?.name ?? id
}

</script>

<template>
  <BaseItem
    :col-span="5"
    :loading="loading"
    :can-delete="(props.isAdmin ?? false) && reservations.length === 0"
    @delete="emit('delete', guest)"
  >
    <template #summary>
      <td><span class="cell-val">{{ guest.name || '—' }}</span></td>
      <td><span class="cell-val">{{ guest.identityDocument ?? '—' }}</span></td>
      <td><span class="cell-val">{{ guest.email ?? '—' }}</span></td>
      <td><span class="cell-val">{{ guest.phoneNumber ?? '—' }}</span></td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">{{ t('guests.detailsPanel') }}</span>
        <div class="details-grid">

          <TextInput
            :text="t('guests.fullName')"
            :model-value="guest.name"
            :rights="isAdmin"
            :placeholder="t('guests.fullName')"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <TextInput
            :text="t('guests.idDocument')"
            :model-value="guest.identityDocument ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.idDocument')"
            @update:model-value="updateField('identityDocument', $event || undefined)"
          />

          <TextInput
            :text="t('guests.email')"
            :model-value="guest.email ?? ''"
            :rights="isAdmin"
            type="email"
            :placeholder="t('guests.email')"
            @update:model-value="updateField('email', $event || undefined)"
          />

          <TextInput
            :text="t('guests.phone')"
            :model-value="guest.phoneNumber ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.phone')"
            @update:model-value="updateField('phoneNumber', $event || undefined)"
          />

          <TextInput
            :text="t('guests.city')"
            :model-value="guest.city ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.city')"
            @update:model-value="updateField('city', $event || undefined)"
          />

          <TextInput
            :text="t('guests.country')"
            :model-value="guest.country ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.country')"
            @update:model-value="updateField('country', $event || undefined)"
          />

          <TextInput
            :text="t('guests.zipCode')"
            :model-value="guest.zipCode ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.zipCode')"
            @update:model-value="updateField('zipCode', $event || undefined)"
          />

          <TextInput
            :text="t('guests.street')"
            :model-value="guest.street ?? ''"
            :rights="isAdmin"
            :placeholder="t('guests.street')"
            @update:model-value="updateField('street', $event || undefined)"
          />

          <TextareaInput
            :text="t('guests.comment')"
            :model-value="guest.comment ?? ''"
            :rights="isAdmin"
            @update:model-value="updateField('comment', $event || undefined)"
          />

        </div>
      </div>

      <div v-if="reservations.length > 0" class="reservations-panel">
        <span class="panel-label">{{ t('guests.reservationsPanel') }}</span>
        <table class="sub-table">
          <thead>
            <tr>
              <th>{{ t('guests.fromCol') }}</th>
              <th>{{ t('guests.toCol') }}</th>
              <th>{{ t('guests.listingCol') }}</th>
              <th>{{ t('guests.amountCol') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in reservations" :key="b.id" class="reservation-row" :class="{ 'reservation-row--readonly': !props.isAdmin }" @click="props.isAdmin && emit('editReservation', b)">
              <td>{{ b.checkIn }}</td>
              <td>{{ b.checkOut }}</td>
              <td>{{ listingName(b.listingId) }}</td>
              <td>{{ b.totalAmountDue }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </BaseItem>
</template>

