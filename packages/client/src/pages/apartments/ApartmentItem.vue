<script setup lang="ts">
import type { Apartment, CalendarLink, Channel } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import CalendarLinksPanel from '../../shared/CalendarLinksPanel.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const props = defineProps<{
  apartment: Apartment
  calendarLinks: CalendarLink[]
  channels: Channel[]
  loading?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [apartment: Apartment, patch: Partial<Omit<Apartment, 'id'>>]
  delete: [apartment: Apartment]
  saveCalendarLink: [channelId: string, apartmentId: string, url: string]
  deleteCalendarLink: [id: string]
}>()

function updateField(field: keyof Omit<Apartment, 'id'>, val: string | number | boolean | undefined) {
  emit('update', props.apartment, { [field]: val })
}

const apartmentLinks = () => props.calendarLinks.filter(l => l.apartmentId === props.apartment.id)
</script>

<template>
  <BaseItem
    :col-span="6"
    :loading="loading"
    :can-delete="isAdmin ?? false"
    @delete="emit('delete', apartment)"
  >
    <template #summary>
      <td>{{ apartment.name || '—' }}</td>
      <td>{{ apartment.address || '—' }}</td>
      <td>{{ apartment.floor }} / {{ apartment.door }}</td>
      <td>€{{ apartment.price }}</td>
      <td>
        <span :class="['badge', apartment.isAvailable ? 'badge--active' : 'badge--inactive']">
          {{ apartment.isAvailable ? 'Yes' : 'No' }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">Apartment details</span>
        <div class="details-grid">

          <TextInput
            text="Name"
            :model-value="apartment.name"
            :rights="isAdmin ?? false"
            placeholder="Name"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <TextInput
            text="Address"
            :model-value="apartment.address"
            :rights="isAdmin ?? false"
            placeholder="Address"
            @update:model-value="updateField('address', $event || undefined)"
          />

          <NumberInput
            text="Floor"
            :model-value="apartment.floor"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('floor', $event)"
          />

          <TextInput
            text="Door"
            :model-value="apartment.door"
            :rights="isAdmin ?? false"
            placeholder="Door"
            @update:model-value="updateField('door', $event || undefined)"
          />

          <NumberInput
            text="Price / night (€)"
            :model-value="apartment.price"
            :min="0"
            :step="0.01"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('price', $event)"
          />

          <NumberInput
            text="Min nights"
            :model-value="apartment.minNights"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('minNights', $event)"
          />

          <NumberInput
            text="Max guests"
            :model-value="apartment.maxGuests"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('maxGuests', $event)"
          />

          <NumberInput
            text="Rooms"
            :model-value="apartment.rooms"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('rooms', $event)"
          />

          <NumberInput
            text="Bathrooms"
            :model-value="apartment.bathrooms"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('bathrooms', $event)"
          />

          <CheckboxInput
            text="Available for booking"
            :model-value="apartment.isAvailable"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('isAvailable', $event)"
          />

          <TextareaInput
            text="Description"
            :model-value="apartment.description ?? ''"
            :rights="isAdmin ?? false"
            placeholder="Description"
            @update:model-value="updateField('description', $event || undefined)"
          />

        </div>
      </div>

      <CalendarLinksPanel
        :links="apartmentLinks()"
        :apartments="[]"
        :channels="channels"
        :is-admin="isAdmin ?? false"
        mode="by-channel"
        :context-id="apartment.id"
        @save="(ch, ap, url) => emit('saveCalendarLink', ch, ap, url)"
        @delete="id => emit('deleteCalendarLink', id)"
      />
    </template>
  </BaseItem>
</template>
