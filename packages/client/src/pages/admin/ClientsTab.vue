<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Client } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const clients = ref<Client[]>([])
const showForm = ref(false)
const editing = ref<Client | null>(null)

const blank = (): Omit<Client, 'id'> => ({
  name: '', identityDocument: '', email: '', phoneNumber: '',
  street: '', city: '', country: '', zipCode: '', comment: '',
})
const form = ref(blank())

async function load() {
  const res = await run(() => api.clients.list())
  if (res) clients.value = res
}

onMounted(load)

function openCreate() { editing.value = null; form.value = blank(); showForm.value = true }
function openEdit(c: Client) { editing.value = c; form.value = { ...c }; showForm.value = true }

async function save() {
  const payload: Omit<Client, 'id'> = {
    name: form.value.name,
    identityDocument: form.value.identityDocument || undefined,
    email: form.value.email || undefined,
    phoneNumber: form.value.phoneNumber || undefined,
    street: form.value.street || undefined,
    city: form.value.city || undefined,
    country: form.value.country || undefined,
    zipCode: form.value.zipCode || undefined,
    comment: form.value.comment || undefined,
  }
  let res: unknown
  if (editing.value) {
    res = await run(() => api.clients.update(editing.value!.id, payload))
  } else {
    res = await run(() => api.clients.create(payload))
  }
  if (res !== undefined) { showForm.value = false; await load(); success(editing.value ? 'Client updated' : 'Client created') }
}

async function del(c: Client) {
  if (!(await confirm(`Delete client "${c.name}"?`))) return
  const res = await run(() => api.clients.delete(c.id))
  if (res !== undefined) { await load(); success('Client deleted') }
}

const search = ref('')
import { computed } from 'vue'
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return clients.value
  return clients.value.filter((c) => c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q))
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>Clients</h3>
      <div class="page-header__spacer" />
      <input v-model="search" type="text" placeholder="Search…" style="max-width: 200px" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add client</button>
    </div>

    <div v-if="filtered.length === 0 && !loading" class="empty-state"><p>No clients found.</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>ID document</th><th>Email</th>
            <th>Phone</th><th>City</th><th>Country</th><th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.identityDocument ?? '—' }}</td>
            <td>{{ c.email ?? '—' }}</td>
            <td>{{ c.phoneNumber ?? '—' }}</td>
            <td>{{ c.city ?? '—' }}</td>
            <td>{{ c.country ?? '—' }}</td>
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
        <div class="modal modal--lg">
          <div class="modal__header">
            <h3>{{ editing ? 'Edit client' : 'New client' }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false">✕</button>
          </div>
          <form @submit.prevent="save">
            <div class="modal__body">
              <div class="form-group">
                <label>Full name *</label>
                <input v-model="form.name" type="text" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>ID document</label>
                  <input v-model="form.identityDocument" type="text" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="form.email" type="email" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input v-model="form.phoneNumber" type="text" />
                </div>
                <div class="form-group">
                  <label>Street</label>
                  <input v-model="form.street" type="text" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>City</label>
                  <input v-model="form.city" type="text" />
                </div>
                <div class="form-group">
                  <label>Country</label>
                  <input v-model="form.country" type="text" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>ZIP code</label>
                  <input v-model="form.zipCode" type="text" />
                </div>
              </div>
              <div class="form-group">
                <label>Comment</label>
                <textarea v-model="form.comment" rows="2" />
              </div>
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
