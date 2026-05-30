<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Channel, Apartment, CalendarLink } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ChannelItem from './ChannelItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const props = defineProps<{ isAdmin?: boolean }>()

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const channels = ref<Channel[]>([])
const apartments = ref<Apartment[]>([])
const calendarLinks = ref<CalendarLink[]>([])
const showForm = ref(false)

const blank = (): Omit<Channel, 'id'> => ({ name: '', commissionRate: 0, isActive: true })
const form = ref(blank())

async function load() {
  const [ch, apt, links] = await Promise.all([
    run(() => api.channels.list()),
    run(() => api.apartments.list()),
    run(() => api.calendarLinks.list()),
  ])
  if (ch) channels.value = ch
  if (apt) apartments.value = apt
  if (links) calendarLinks.value = links
}

onMounted(load)

function openCreate() { form.value = blank(); showForm.value = true }

async function save() {
  const payload = { ...form.value, commissionRate: Number(form.value.commissionRate) }
  const res = await run(() => api.channels.create(payload))
  if (res !== undefined) { showForm.value = false; await load(); success('Channel created') }
}

async function updateField(channel: Channel, patch: Partial<Omit<Channel, 'id'>>) {
  const res = await run(() => api.channels.update(channel.id, patch))
  if (res !== undefined) {
    const idx = channels.value.findIndex(c => c.id === channel.id)
    if (idx !== -1) channels.value[idx] = { ...channels.value[idx], ...patch }
  }
}

async function del(c: Channel) {
  if (!(await confirm(`Delete channel "${c.name}"?`))) return
  const res = await run(() => api.channels.delete(c.id))
  if (res !== undefined) { await load(); success('Channel deleted') }
}

async function saveCalendarLink(channelId: string, apartmentId: string, url: string) {
  const res = await run(() => api.calendarLinks.upsert({ channelId, apartmentId, url }))
  if (res !== undefined) {
    const idx = calendarLinks.value.findIndex(
      l => l.channelId === channelId && l.apartmentId === apartmentId
    )
    if (idx !== -1) {
      calendarLinks.value[idx] = res
    } else {
      calendarLinks.value = [...calendarLinks.value, res]
    }
  }
}

async function deleteCalendarLink(id: string) {
  const res = await run(() => api.calendarLinks.delete(id))
  if (res !== undefined) {
    calendarLinks.value = calendarLinks.value.filter(l => l.id !== id)
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h3>Channels</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add channel</button>
    </div>

    <BaseList :is-empty="channels.length === 0 && !loading" empty-message="No channels yet.">
      <template #header>
        <th>Name</th>
        <th>Commission</th>
        <th>Status</th>
        <th />
      </template>
      <ChannelItem
        v-for="c in channels"
        :key="c.id"
        :channel="c"
        :calendar-links="calendarLinks"
        :apartments="apartments"
        :loading="loading"
        :is-admin="props.isAdmin"
        @update="updateField"
        @delete="del"
        @save-calendar-link="saveCalendarLink"
        @delete-calendar-link="deleteCalendarLink"
      />
    </BaseList>

    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>New channel</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <TextInput mode="form" text="Name *" v-model="form.name" required />
              <NumberInput mode="form" text="Commission rate (%)" v-model="form.commissionRate" :min="0" :max="100" :step="0.1" />
              <CheckboxInput mode="form" text="Active" v-model="form.isActive" />
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
