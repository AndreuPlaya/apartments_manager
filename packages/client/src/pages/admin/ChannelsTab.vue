<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const channels = ref<Channel[]>([])
const showForm = ref(false)
const editing = ref<Channel | null>(null)

const blank = (): Omit<Channel, 'id'> => ({ name: '', commissionRate: 0, isActive: true })
const form = ref(blank())

async function load() {
  const res = await run(() => api.channels.list())
  if (res) channels.value = res
}

onMounted(load)

function openCreate() { editing.value = null; form.value = blank(); showForm.value = true }
function openEdit(c: Channel) { editing.value = c; form.value = { ...c }; showForm.value = true }

async function save() {
  const payload = { ...form.value, commissionRate: Number(form.value.commissionRate) }
  let res: unknown
  if (editing.value) {
    res = await run(() => api.channels.update(editing.value!.id, payload))
  } else {
    res = await run(() => api.channels.create(payload))
  }
  if (res !== undefined) { showForm.value = false; await load(); success(editing.value ? 'Channel updated' : 'Channel created') }
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

    <div v-if="channels.length === 0 && !loading" class="empty-state"><p>No channels yet.</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Commission rate</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          <tr v-for="c in channels" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.commissionRate }}%</td>
            <td>
              <span :class="['badge', c.isActive ? 'badge--active' : 'badge--inactive']">
                {{ c.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn btn--ghost btn--sm" @click="openEdit(c)">Edit</button>
                <button class="btn btn--ghost btn--sm text-danger" @click="del(c)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>{{ editing ? 'Edit channel' : 'New channel' }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false">✕</button>
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
