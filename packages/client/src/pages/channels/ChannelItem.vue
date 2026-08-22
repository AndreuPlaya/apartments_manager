<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Channel, CalendarLink, Listing } from '../../api/client'
import BaseItem from '../../shared/BaseItem.vue'
import CalendarLinksPanel from '../../shared/CalendarLinksPanel.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const { t } = useI18n()

const props = defineProps<{
  channel: Channel
  calendarLinks: CalendarLink[]
  listings: Listing[]
  loading?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [channel: Channel, patch: Partial<Omit<Channel, 'id'>>]
  delete: [channel: Channel]
  saveCalendarLink: [channelId: string, listingId: string, url: string]
  deleteCalendarLink: [id: string]
}>()

function updateField(field: keyof Omit<Channel, 'id'>, val: string | number | boolean | undefined) {
  emit('update', props.channel, { [field]: val })
}

const channelLinks = () => props.calendarLinks.filter(l => l.channelId === props.channel.id)
</script>

<template>
  <BaseItem
    :col-span="4"
    :loading="loading"
    :can-delete="isAdmin ?? false"
    @delete="emit('delete', channel)"
  >
    <template #summary>
      <td>{{ channel.name }}</td>
      <td>{{ channel.commissionRate }}%</td>
      <td>
        <span :class="['badge', channel.isActive ? 'badge--active' : 'badge--inactive']">
          {{ channel.isActive ? t('channels.activeStatus') : t('channels.inactiveStatus') }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">{{ t('channels.detailsPanel') }}</span>
        <div class="details-grid details-grid--3col">

          <TextInput
            :text="t('channels.name')"
            :model-value="channel.name"
            :rights="isAdmin ?? false"
            :placeholder="t('channels.name')"
            @update:model-value="updateField('name', $event || undefined)"
          />

          <NumberInput
            :text="t('channels.commissionRate')"
            :model-value="channel.commissionRate"
            :min="0"
            :max="100"
            :step="0.1"
            :display-fn="v => v + '%'"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('commissionRate', $event)"
          />

          <CheckboxInput
            :text="t('channels.active')"
            :model-value="channel.isActive"
            :rights="isAdmin ?? false"
            @update:model-value="updateField('isActive', $event)"
          />

        </div>
      </div>

      <CalendarLinksPanel
        :links="channelLinks()"
        :listings="listings"
        :channels="[]"
        :is-admin="isAdmin ?? false"
        mode="by-listing"
        :context-id="channel.id"
        @save="(ch, ap, url) => emit('saveCalendarLink', ch, ap, url)"
        @delete="id => emit('deleteCalendarLink', id)"
      />
    </template>
  </BaseItem>
</template>
