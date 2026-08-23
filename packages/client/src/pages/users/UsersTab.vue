<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserItem as UserData, UserPatch } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useAuthConfig } from '../../composables/useAuthConfig'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import UserItemComponent from './UserItem.vue'
import BaseList from '../../shared/BaseList.vue'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const { t } = useI18n()
const { loading, run } = useAsyncOp()
const { username: ownUsername } = useAuthConfig()
const { success } = useToast()
const { confirm } = useConfirm()

const users = ref<UserData[]>([])
const showForm = ref(false)

const createForm = ref({ username: '', password: '', full_name: '', email: '', isAdmin: false })

async function load() {
  const res = await run(() => api.users.list())
  if (res) users.value = res
}

onMounted(load)

function openCreate() {
  createForm.value = { username: '', password: '', full_name: '', email: '', isAdmin: false }
  showForm.value = true
}

async function create() {
  const res = await run(() => api.users.create(createForm.value))
  if (res !== undefined) { showForm.value = false; await load(); success(t('users.created')) }
}

async function updateField(user: UserData, patch: UserPatch) {
  const res = await run(() => api.users.update(user.id, patch))
  if (res === undefined) return
  // A role change moves the account between the server's two buckets, and its id
  // moves with it, so the row we were editing no longer answers to the id we
  // hold — and its position in the list changes too. Reload rather than patch.
  if (res.id !== user.id) { await load(); return }
  const idx = users.value.findIndex(u => u.id === user.id)
  // The server's reply, not the patch we sent: it normalizes what it stored
  // (a trimmed email, a blank one dropped) and the row must show that.
  if (idx !== -1) users.value[idx] = res
}

async function del(u: UserData) {
  if (!(await confirm(t('users.deleteConfirm', { username: u.username })))) return
  const res = await run(() => api.users.delete(u.id))
  if (res !== undefined) { await load(); success(t('users.deleted')) }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h3>{{ t('users.title') }}</h3>
      <div class="page-header__spacer" />
      <button class="btn btn--primary btn--sm" @click="openCreate">{{ t('users.addUser') }}</button>
    </div>

    <BaseList :is-empty="users.length === 0 && !loading" :empty-message="t('users.noUsers')">
      <template #header>
        <th>{{ t('users.usernameCol') }}</th>
        <th>{{ t('users.fullNameCol') }}</th>
        <th>{{ t('users.emailCol') }}</th>
        <th>{{ t('users.roleCol') }}</th>
        <th>{{ t('users.statusCol') }}</th>
        <th />
      </template>
      <UserItemComponent
        v-for="u in users"
        :key="u.id"
        :user="u"
        :is-self="u.username === ownUsername"
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
            <h3>{{ t('users.newUser') }}</h3>
            <button class="btn btn--ghost btn--sm" @click="showForm = false"><AppIcon name="x" /></button>
          </div>
          <form @submit.prevent="create">
            <div class="modal__body">
              <TextInput mode="form" :text="t('users.fullName') + ' *'" v-model="createForm.full_name" required />
              <TextInput mode="form" :text="t('users.username') + ' *'" v-model="createForm.username" autocomplete="off" required />
              <TextInput mode="form" :text="t('users.email')" v-model="createForm.email" type="email" autocomplete="off" :hint="t('users.emailHint')" />
              <TextInput mode="form" :text="t('users.password') + ' *'" v-model="createForm.password" type="password" autocomplete="new-password" :required="true" :minlength="8" :hint="t('auth.passwordHint')" />
              <CheckboxInput mode="form" :text="t('users.adminAccess')" v-model="createForm.isAdmin" />
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showForm = false">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? t('users.creating') : t('users.createUser') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
