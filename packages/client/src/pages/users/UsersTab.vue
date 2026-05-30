<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserItem as UserData } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import UserItemComponent from './UserItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const { loading, run } = useAsyncOp()
const { success } = useToast()
const { confirm } = useConfirm()

const users = ref<UserData[]>([])
const showForm = ref(false)

const createForm = ref({ username: '', password: '', full_name: '', isAdmin: false })

async function load() {
  const res = await run(() => api.users.list())
  if (res) users.value = res
}

onMounted(load)

function openCreate() {
  createForm.value = { username: '', password: '', full_name: '', isAdmin: false }
  showForm.value = true
}

async function create() {
  const res = await run(() => api.users.create(createForm.value))
  if (res !== undefined) { showForm.value = false; await load(); success('User created') }
}

async function updateField(user: UserData, patch: { username?: string; password?: string; full_name?: string; enabled?: boolean }) {
  const res = await run(() => api.users.update(user.id, patch))
  if (res !== undefined) {
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...patch }
  }
}

async function del(u: UserData) {
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

    <BaseList :is-empty="users.length === 0 && !loading" empty-message="No users found.">
      <template #header>
        <th>Username</th>
        <th>Full name</th>
        <th>Role</th>
        <th>Status</th>
        <th />
      </template>
      <UserItemComponent
        v-for="u in users"
        :key="u.id"
        :user="u"
        :loading="loading"
        @update="updateField"
        @delete="del"
      />
    </BaseList>

    <!-- Create modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>New user</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="create">
            <div class="modal__body">
              <TextInput mode="form" text="Full name *" v-model="createForm.full_name" required />
              <TextInput mode="form" text="Username *" v-model="createForm.username" autocomplete="off" required />
              <TextInput mode="form" text="Password *" v-model="createForm.password" type="password" autocomplete="new-password" :required="true" :minlength="8" hint="Minimum 8 characters" />
              <CheckboxInput mode="form" text="Admin (full write access)" v-model="createForm.isAdmin" />
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
  </div>
</template>
