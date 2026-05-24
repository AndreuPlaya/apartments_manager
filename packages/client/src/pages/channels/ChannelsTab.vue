<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import ChannelItem from './ChannelItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const channels = ref<Channel[]>([])
const showForm = ref(false)

const blank = (): Omit<Channel, 'id'> => ({ name: '', commissionRate: 0, isActive: true })
const form = ref(blank())

async function load() {
  const res = await run(() => api.channels.list())
  if (res) channels.value = res
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
        :loading="loading"
        @update="updateField"
        @delete="del"
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
              <div class="form-group">
                <label>Name *</label>
                <input v-model="form.name" type="text" required />
              </div>
              <div class="form-group">
                <label>Commission rate (%)</label>
                <input v-model="form.commissionRate" type="number" min="0" max="100" step="0.1" />
              </div>
              <label class="checkbox-row">
                <input v-model="form.isActive" type="checkbox" />
                Active
              </label>
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
