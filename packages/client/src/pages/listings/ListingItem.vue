<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Listing, CalendarLink, Channel } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import CalendarLinksPanel from '../../shared/CalendarLinksPanel.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CurrencyInput from '../../shared/fields/CurrencyInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()

const props = defineProps<{
  listing: Listing
  calendarLinks: CalendarLink[]
  channels: Channel[]
  loading?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [listing: Listing, patch: Partial<Omit<Listing, 'id'>>]
  delete: [listing: Listing]
  saveCalendarLink: [channelId: string, listingId: string, url: string]
  deleteCalendarLink: [id: string]
}>()

function updateField(field: keyof Omit<Listing, 'id'>, val: string | number | boolean | undefined) {
  emit('update', props.listing, { [field]: val })
}

const listingLinks = () => props.calendarLinks.filter(l => l.listingId === props.listing.id)
</script>

<template>
  <BaseItem
    :col-span="6"
    :loading="loading"
    :can-delete="isAdmin ?? false"
    @delete="emit('delete', listing)"
  >
    <template #summary>
      <td>{{ listing.name || '—' }}</td>
      <td>{{ listing.address || '—' }}</td>
      <td>{{ listing.floor }} / {{ listing.door }}</td>
      <td>€{{ listing.nightlyRate }}</td>
      <td>
        <span :class="['badge', listing.isActive ? 'badge--active' : 'badge--inactive']">
          {{ listing.isActive ? t('common.yes') : t('common.no') }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">{{ t('listings.detailsPanel') }}</span>
        <div class="details-grid">

          <TextInput
            :text="t('listings.name')"
            :model-value="listing.name"
            :rights="isAdmin ?? false"
            :placeholder="t('listings.name')"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <TextInput
            :text="t('listings.address')"
            :model-value="listing.address"
            :rights="isAdmin ?? false"
            :placeholder="t('listings.address')"
            @update:model-value="updateField('address', $event || undefined)"
          />

          <NumberInput
            :text="t('listings.floor')"
            :model-value="listing.floor"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('floor', $event)"
          />

          <TextInput
            :text="t('listings.door')"
            :model-value="listing.door"
            :rights="isAdmin ?? false"
            :placeholder="t('listings.door')"
            @update:model-value="updateField('door', $event || undefined)"
          />

          <CurrencyInput
            :text="t('listings.nightlyRate')"
            :model-value="listing.nightlyRate"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('nightlyRate', $event)"
          />

          <NumberInput
            :text="t('listings.minNights')"
            :model-value="listing.minNights"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('minNights', $event)"
          />

          <NumberInput
            :text="t('listings.maxAdults')"
            :model-value="listing.maxAdults"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('maxAdults', $event)"
          />

          <NumberInput
            :text="t('listings.rooms')"
            :model-value="listing.rooms"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('rooms', $event)"
          />

          <NumberInput
            :text="t('listings.bathrooms')"
            :model-value="listing.bathrooms"
            :min="1"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('bathrooms', $event)"
          />

          <CheckboxInput
            :text="t('listings.activeForReservations')"
            :model-value="listing.isActive"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('isActive', $event)"
          />

          <TextareaInput
            :text="t('listings.description')"
            :model-value="listing.description ?? ''"
            :rights="isAdmin ?? false"
            :placeholder="t('listings.description')"
            @update:model-value="updateField('description', $event || undefined)"
          />

        </div>
      </div>

      <CalendarLinksPanel
        :links="listingLinks()"
        :listings="[]"
        :channels="channels"
        :is-admin="isAdmin ?? false"
        mode="by-channel"
        :context-id="listing.id"
        @save="(ch, ap, url) => emit('saveCalendarLink', ch, ap, url)"
        @delete="id => emit('deleteCalendarLink', id)"
      />
    </template>
  </BaseItem>
</template>
