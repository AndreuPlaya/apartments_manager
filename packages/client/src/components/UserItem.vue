<script setup lang="ts">
import { ref } from 'vue'
import type { UserItem as UserData } from '../api/client'
import { useInlineEdit } from '../composables/useInlineEdit'
import BaseItem from './BaseItem.vue'


const props = defineProps<{
  user: UserData
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [user: UserData, patch: { username?: string; full_name?: string; enabled?: boolean; password?: string }]
  delete: [user: UserData]
}>()

type UserField = 'full_name' | 'username' | 'password'

const inputRef = ref<HTMLInputElement | null>(null)
const { editingField, editingValue, startEdit, cancelEdit } = useInlineEdit<UserField>(inputRef)

function commitEdit() {
  const field = editingField.value
  if (!field) return
  editingField.value = null

  const val = editingValue.value.trim()

  if (field === 'password') {
    if (!val) return
    emit('update', props.user, { password: val })
    return
  }

  if (!val) return
  const current = String(props.user[field as keyof UserData] ?? '')
  if (val === current) return

  emit('update', props.user, { [field]: val })
}

function toggleEnabled() {
  emit('update', props.user, { enabled: !props.user.enabled })
}
</script>

<template>
  <BaseItem
    :col-span="5"
    :loading="loading"
    :can-delete="!user.isAdmin"
    @delete="emit('delete', user)"
  >
    <template #summary>
      <td>{{ user.username }}</td>
      <td>{{ user.full_name }}</td>
      <td>
        <span :class="['badge', user.isAdmin ? 'badge--admin' : '']">
          {{ user.isAdmin ? 'Admin' : 'Employee' }}
        </span>
      </td>
      <td>
        <span :class="['badge', user.enabled ? 'badge--enabled' : 'badge--disabled']">
          {{ user.enabled ? 'Enabled' : 'Disabled' }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">User details</span>
        <div class="details-grid">

          <div :class="['detail-field', editingField === 'full_name' && 'detail-field--editing']"
            @click="startEdit('full_name', user.full_name)">
            <span class="detail-field__label">Full name</span>
            <span v-if="editingField !== 'full_name'" class="detail-field__val">{{ user.full_name || '—' }}</span>
            <input v-else ref="inputRef" v-model="editingValue" placeholder="Full name"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'username' && 'detail-field--editing']"
            @click="startEdit('username', user.username)">
            <span class="detail-field__label">Username</span>
            <span v-if="editingField !== 'username'" class="detail-field__val">{{ user.username }}</span>
            <input v-else ref="inputRef" v-model="editingValue" autocomplete="off" :placeholder="user.username"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div :class="['detail-field', editingField === 'password' && 'detail-field--editing']"
            @click="startEdit('password', '')">
            <span class="detail-field__label">Password</span>
            <span v-if="editingField !== 'password'" class="detail-field__val text-muted">••••••••</span>
            <input v-else ref="inputRef" v-model="editingValue" type="password" autocomplete="new-password"
              placeholder="Leave blank to keep" minlength="8"
              @blur="commitEdit" @keydown.enter.prevent="commitEdit" @keydown.escape.prevent="cancelEdit" @click.stop />
          </div>

          <div v-if="!user.isAdmin" class="detail-field detail-field--checkbox" @click.stop="toggleEnabled">
            <input type="checkbox" :checked="user.enabled" @change.stop="toggleEnabled" @click.stop />
            <span class="detail-field__label" style="margin-bottom:0">Enabled (can log in)</span>
          </div>

        </div>
      </div>
    </template>
  </BaseItem>
</template>
