<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserItem } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const users = ref<UserItem[]>([])
const showForm = ref(false)
const showEdit = ref(false)
const editingUser = ref<UserItem | null>(null)

const createForm = ref({ username: '', password: '', full_name: '', isAdmin: false })
const editForm = ref({ username: '', password: '', full_name: '', enabled: true })

async function load() {
  const res = await run(() => api.users.list())
  if (res) users.value = res
}

onMounted(load)

function openCreate() {
  createForm.value = { username: '', password: '', full_name: '', isAdmin: false }
  showForm.value = true
}

function openEdit(u: UserItem) {
  editingUser.value = u
  editForm.value = { username: u.username, password: '', full_name: u.full_name, enabled: u.enabled }
  showEdit.value = true
}

async function create() {
  const res = await run(() => api.users.create(createForm.value))
  if (res !== undefined) { showForm.value = false; await load(); success('User created') }
}

async function update() {
  if (!editingUser.value) return
  const payload: { username?: string; password?: string; full_name?: string; enabled?: boolean } = {
    full_name: editForm.value.full_name,
    enabled: editForm.value.enabled,
  }
  if (editForm.value.username) payload.username = editForm.value.username
  if (editForm.value.password) payload.password = editForm.value.password
  const res = await run(() => api.users.update(editingUser.value!.id, payload))
  if (res !== undefined) { showEdit.value = false; await load(); success('User updated') }
}

async function del(u: UserItem) {
  if (!(await confirm(`Delete user "${u.username}"? This cannot be undone.`))) return
  const res = await run(() => api.users.delete(u.id))
  if (res !== undefined) { await load(); success('User deleted') }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h3>Users</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">+ Add user</button>
    </div>

    <div v-if="users.length === 0 && !loading" class="empty-state"><p>No users found.</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr><th>Username</th><th>Full name</th><th>Role</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.username }}</td>
            <td>{{ u.full_name }}</td>
            <td>
              <span :class="['badge', u.isAdmin ? 'badge--admin' : '']">
                {{ u.isAdmin ? 'Admin' : 'Employee' }}
              </span>
            </td>
            <td>
              <span :class="['badge', u.enabled ? 'badge--enabled' : 'badge--disabled']">
                {{ u.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn btn--ghost btn--sm" @click="openEdit(u)">Edit</button>
                <button v-if="!u.isAdmin" class="btn btn--ghost btn--sm text-danger" @click="del(u)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>New user</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false">✕</button>
          </div>
          <form @submit.prevent="create">
            <div class="modal__body">
              <div class="form-group">
                <label>Full name *</label>
                <input v-model="createForm.full_name" type="text" required />
              </div>
              <div class="form-group">
                <label>Username *</label>
                <input v-model="createForm.username" type="text" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input v-model="createForm.password" type="password" autocomplete="new-password" required minlength="8" />
                <span class="text-muted text-sm">Minimum 8 characters</span>
              </div>
              <label class="checkbox-row">
                <input v-model="createForm.isAdmin" type="checkbox" />
                Admin (full write access)
              </label>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showForm = false">Cancel</button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Creating…' : 'Create user' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Edit modal -->
    <Teleport to="body">
      <div v-if="showEdit" class="modal-backdrop" @click.self="showEdit = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>Edit user — {{ editingUser?.username }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showEdit = false">✕</button>
          </div>
          <form @submit.prevent="update">
            <div class="modal__body">
              <div class="form-group">
                <label>Full name</label>
                <input v-model="editForm.full_name" type="text" />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input v-model="editForm.username" type="text" autocomplete="off" :placeholder="editingUser?.username" />
              </div>
              <div class="form-group">
                <label>New password</label>
                <input v-model="editForm.password" type="password" autocomplete="new-password" placeholder="Leave blank to keep" minlength="8" />
              </div>
              <label v-if="!editingUser?.isAdmin" class="checkbox-row">
                <input v-model="editForm.enabled" type="checkbox" />
                Enabled (uncheck to disable login)
              </label>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showEdit = false">Cancel</button>
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
