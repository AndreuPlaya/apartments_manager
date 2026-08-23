<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserItem as UserData, UserPatch } from '../../api/client'
import { useInlineEdit } from '../../composables/useInlineEdit'
import BaseItem from '../../shared/BaseItem.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import SelectInput from '../../shared/fields/SelectInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'

const { t } = useI18n()

const props = defineProps<{
  user: UserData
  /** The row belonging to whoever is looking at it. Its lockout controls are read-only. */
  isSelf?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [user: UserData, patch: UserPatch]
  delete: [user: UserData]
}>()

const roleOptions = computed(() => [
  { value: 'admin', label: t('users.adminRole') },
  { value: 'employee', label: t('users.employeeRole') },
])

const role = computed(() => (props.user.isAdmin ? 'admin' : 'employee'))

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
    :col-span="6"
    :loading="loading"
    :can-delete="!isSelf"
    @delete="emit('delete', user)"
  >
    <template #summary>
      <td>{{ user.username }}</td>
      <td>{{ user.full_name }}</td>
      <td class="text-muted">{{ user.email || '—' }}</td>
      <td>
        <span :class="['badge', user.isAdmin ? 'badge--admin' : '']">
          {{ user.isAdmin ? t('users.adminRole') : t('users.employeeRole') }}
        </span>
      </td>
      <td>
        <span :class="['badge', user.enabled ? 'badge--enabled' : 'badge--disabled']">
          {{ user.enabled ? t('users.enabledStatus') : t('users.disabledStatus') }}
        </span>
      </td>
    </template>

    <template #drawer>
      <div class="details-panel">
        <span class="panel-label">{{ t('users.detailsPanel') }}</span>
        <div class="details-grid">

          <TextInput
            :text="t('users.fullName')"
            :model-value="user.full_name"
            :placeholder="t('users.fullName')"
            @update:model-value="val => val && emit('update', user, { full_name: val })"
          />

          <TextInput
            :text="t('users.username')"
            :model-value="user.username"
            :placeholder="user.username"
            autocomplete="off"
            @update:model-value="val => val && emit('update', user, { username: val })"
          />

          <!-- Unlike the fields around it, an empty value is meaningful here: it
               removes the address. -->
          <TextInput
            :text="t('users.email')"
            :model-value="user.email ?? ''"
            :placeholder="t('users.emailPlaceholder')"
            autocomplete="off"
            @update:model-value="val => emit('update', user, { email: val })"
          />

          <!-- Password: kept raw — display is always '••••••••', draft always starts empty -->
          <div
            :class="['detail-field', passwordEditing === 'password' && 'detail-field--editing']"
            @click="startPasswordEdit('password', '')"
          >
            <span class="detail-field__label">{{ t('users.password') }}</span>
            <span v-if="passwordEditing !== 'password'" class="detail-field__val text-muted">••••••••</span>
            <input
              v-else
              ref="passwordRef"
              v-model="passwordDraft"
              type="password"
              autocomplete="new-password"
              :placeholder="t('users.passwordPlaceholder')"
              minlength="8"
              @blur="commitPassword"
              @keydown.enter.prevent="commitPassword"
              @keydown.escape.prevent="cancelPasswordEdit"
              @click.stop
            />
          </div>

          <!--
            Role and the login switch are the two edits that can lock somebody
            out, so on your own row they are shown and not offered. The server
            refuses them either way — this only saves the operator a toast that
            reads like a fault.
          -->
          <SelectInput
            :text="t('users.roleCol')"
            :model-value="role"
            :options="roleOptions"
            :rights="!isSelf"
            @update:model-value="val => emit('update', user, { isAdmin: val === 'admin' })"
          />

          <CheckboxInput
            :text="t('users.enabledLogin')"
            :model-value="user.enabled"
            :rights="!isSelf"
            @update:model-value="emit('update', user, { enabled: $event })"
          />

        </div>
      </div>
    </template>
  </BaseItem>
</template>
