<script setup lang="ts">
import { ref } from 'vue'
import type { Apartment, CalendarLink, Channel } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import BaseItem from '../../shared/BaseItem.vue'
import CalendarLinksPanel from '../../shared/CalendarLinksPanel.vue'

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

type ApartmentField = keyof Omit<Apartment, 'id'>

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const { editingField, editingValue, startEdit, cancelEdit } = useInlineEdit<ApartmentField>(inputRef)

const numericFields: ApartmentField[] = ['floor', 'price', 'minNights', 'maxGuests', 'rooms', 'bathrooms']

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null

  const raw = editingValue.value
  let val: string | number | boolean | undefined = raw.trim()

  if (numericFields.includes(field)) {
    val = Number(raw)
  } else if (!val) {
    val = undefined
  }

  const current = props.apartment[field as keyof Apartment]
  if (val === current) return

  emit('update', props.apartment, { [field]: val })
}

function toggleAvailable() {
  emit('update', props.apartment, { isAvailable: !props.apartment.isAvailable })
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

          <div :class="['detail-field', editingField === 'name' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('name', apartment.name)">
            <span class="detail-field__label">Name</span>
            <span v-if="editingField !== 'name'" class="detail-field__val">{{ apartment.name || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Name"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'address' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('address', apartment.address)">
            <span class="detail-field__label">Address</span>
            <span v-if="editingField !== 'address'" class="detail-field__val">{{ apartment.address || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Address"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'floor' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('floor', apartment.floor)">
            <span class="detail-field__label">Floor</span>
            <span v-if="editingField !== 'floor'" class="detail-field__val">{{ apartment.floor }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'door' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('door', apartment.door)">
            <span class="detail-field__label">Door</span>
            <span v-if="editingField !== 'door'" class="detail-field__val">{{ apartment.door || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Door"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'price' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('price', apartment.price)">
            <span class="detail-field__label">Price / night (€)</span>
            <span v-if="editingField !== 'price'" class="detail-field__val">{{ apartment.price }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="0" step="0.01"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'minNights' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('minNights', apartment.minNights)">
            <span class="detail-field__label">Min nights</span>
            <span v-if="editingField !== 'minNights'" class="detail-field__val">{{ apartment.minNights }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'maxGuests' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('maxGuests', apartment.maxGuests)">
            <span class="detail-field__label">Max guests</span>
            <span v-if="editingField !== 'maxGuests'" class="detail-field__val">{{ apartment.maxGuests }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'rooms' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('rooms', apartment.rooms)">
            <span class="detail-field__label">Rooms</span>
            <span v-if="editingField !== 'rooms'" class="detail-field__val">{{ apartment.rooms }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'bathrooms' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('bathrooms', apartment.bathrooms)">
            <span class="detail-field__label">Bathrooms</span>
            <span v-if="editingField !== 'bathrooms'" class="detail-field__val">{{ apartment.bathrooms }}</span>
            <input v-else ref="inputRef" v-model="editingValue" type="number" min="1"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div class="detail-field detail-field--checkbox" @click.stop="(isAdmin ?? false) && toggleAvailable()">
            <input type="checkbox" :checked="apartment.isAvailable" :disabled="!(isAdmin ?? false)" @change.stop="toggleAvailable" @click.stop />
            <span class="detail-field__label" style="margin-bottom:0">Available for booking</span>
          </div>

          <div :class="['detail-field', 'detail-field--wide', editingField === 'description' && 'detail-field--editing']"
            @click="(isAdmin ?? false) && startEdit('description', apartment.description ?? '')">
            <span class="detail-field__label">Description</span>
            <span v-if="editingField !== 'description'" class="detail-field__val detail-field__val--pre">{{ apartment.description || '—' }}</span>
            <textarea v-else ref="inputRef" v-model="editingValue" rows="2" placeholder="Description"
              @blur="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

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
