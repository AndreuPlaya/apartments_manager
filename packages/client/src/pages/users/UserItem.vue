<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { UserItem as UserData } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import BaseItem from '../../shared/BaseItem.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const props = defineProps<{
  user: UserData
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [user: UserData, patch: { username?: string; full_name?: string; enabled?: boolean; password?: string }]
  delete: [user: UserData]
}>()

// Password field is kept raw: it shows '••••••••' as display and starts with an empty draft
const passwordRef = ref<HTMLInputElement | null>(null)
const { editingField: passwordEditing, editingValue: passwordDraft, startEdit: startPasswordEdit, cancelEdit: cancelPasswordEdit } = useInlineEdit<'password'>(passwordRef)

function commitPassword() {
  passwordEditing.value = null
  const val = passwordDraft.value.trim()
  if (!val) return
  emit('update', props.user, { password: val })
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

          <TextInput
            text="Full name"
            :model-value="user.full_name"
            placeholder="Full name"
            @update:model-value="val => val && emit('update', user, { full_name: val })"
          />

          <TextInput
            text="Username"
            :model-value="user.username"
            :placeholder="user.username"
            autocomplete="off"
            @update:model-value="val => val && emit('update', user, { username: val })"
          />

          <!-- Password: kept raw — display is always '••••••••', draft always starts empty -->
          <div
            :class="['detail-field', passwordEditing === 'password' && 'detail-field--editing']"
            @click="startPasswordEdit('password', '')"
          >
            <span class="detail-field__label">Password</span>
            <span v-if="passwordEditing !== 'password'" class="detail-field__val text-muted">••••••••</span>
            <input
              v-else
              ref="passwordRef"
              v-model="passwordDraft"
              type="password"
              autocomplete="new-password"
              placeholder="Leave blank to keep"
              minlength="8"
              @blur="commitPassword"
              @keydown.enter.prevent="commitPassword"
              @keydown.escape.prevent="cancelPasswordEdit"
              @click.stop
            />
          </div>

          <CheckboxInput
            v-if="!user.isAdmin"
            text="Enabled (can log in)"
            :model-value="user.enabled"
            @update:model-value="emit('update', user, { enabled: $event })"
          />

        </div>
      </div>
    </template>
  </BaseItem>
</template>
