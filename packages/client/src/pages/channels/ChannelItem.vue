<script setup lang="ts">
import { ref } from 'vue'
import type { Channel, CalendarLink, Apartment } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import BaseItem from '../../shared/BaseItem.vue'
import CalendarLinksPanel from '../../shared/CalendarLinksPanel.vue'

const props = defineProps<{
  channel: Channel
  calendarLinks: CalendarLink[]
  apartments: Apartment[]
  loading?: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  update: [channel: Channel, patch: Partial<Omit<Channel, 'id'>>]
  delete: [channel: Channel]
  saveCalendarLink: [channelId: string, apartmentId: string, url: string]
  deleteCalendarLink: [id: string]
}>()

type ChannelField = keyof Omit<Channel, 'id'>

const inputRef = ref<HTMLInputElement | null>(null)
const { editingField, editingValue, startEdit, cancelEdit } = useInlineEdit<ChannelField>(inputRef)

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null

  const raw = editingValue.value.trim()
  let val: string | number | undefined = raw

  if (field === 'commissionRate') {
    val = Number(raw)
  } else if (!val) {
    val = undefined
  }

  const current = props.channel[field as keyof Channel]
  if (val === current) return

  emit('update', props.channel, { [field]: val })
}

function toggleActive() {
  emit('update', props.channel, { isActive: !props.channel.isActive })
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
          {{ channel.isActive ? 'Active' : 'Inactive' }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">Channel details</span>
        <div class="details-grid details-grid--3col">

          <div :class="['detail-field', editingField === 'name' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('name', channel.name)">
            <span class="detail-field__label">Name</span>
            <span v-if="editingField !== 'name'" class="detail-field__val">{{ channel.name }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Name"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'commissionRate' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('commissionRate', channel.commissionRate)">
            <span class="detail-field__label">Commission rate (%)</span>
            <span v-if="editingField !== 'commissionRate'" class="detail-field__val">{{ channel.commissionRate }}%</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="0" max="100" step="0.1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div class="detail-field detail-field--checkbox" @click.stop="(isAdmin ?? false) && toggleActive()">
            <input type="checkbox" :checked="channel.isActive" :disabled="!(isAdmin ?? false)" @change.stop="toggleActive" @click.stop />
            <span class="detail-field__label" style="margin-bottom:0">Active</span>
          </div>

        </div>
      </div>

      <CalendarLinksPanel
        :links="channelLinks()"
        :apartments="apartments"
        :channels="[]"
        :is-admin="isAdmin ?? false"
        mode="by-apartment"
        :context-id="channel.id"
        @save="(ch, ap, url) => emit('saveCalendarLink', ch, ap, url)"
        @delete="id => emit('deleteCalendarLink', id)"
      />
    </template>
  </BaseItem>
</template>
