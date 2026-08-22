<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Guest } from '../../api/client'
import AppIcon from '../../shared/AppIcon.vue'
import TextInput from '../../shared/fields/TextInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()

const props = defineProps<{
  guest: Guest
  isAdmin: boolean
}>()

const emit = defineEmits<{
  save: [guest: Guest, patch: Partial<Omit<Guest, 'id'>>]
  close: []
}>()

const form = ref({ ...props.guest })

watch(() => props.guest, (c) => { form.value = { ...c } }, { immediate: true })

function save() {
  const fields: (keyof Omit<Guest, 'id'>)[] = [
    'name', 'identityDocument', 'email', 'phoneNumber',
    'street', 'city', 'country', 'zipCode', 'comment',
  ]
  const patch: Partial<Omit<Guest, 'id'>> = {}
  for (const f of fields) {
    const val = (form.value[f] as string | undefined)?.trim() || undefined
    if (val !== props.guest[f]) patch[f] = val
  }
  if (Object.keys(patch).length > 0) emit('save', props.guest, patch)
  else emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal modal--lg">
        <div class="modal__header">
          <h3>{{ isAdmin ? t('guests.editGuest') : t('guests.guestInfo') }}</h3>
          <button class="btn btn--ghost btn--sm" @click="emit('close')"><AppIcon name="x" /></button>
        </div>

        <!-- Admin: editable form -->
        <form v-if="isAdmin" @submit.prevent="save">
          <div class="modal__body">
            <TextInput mode="form" :text="t('guests.name') + ' *'" v-model="form.name" required />
            <div class="form-row">
              <TextInput mode="form" :text="t('guests.identityDocument')" v-model="form.identityDocument" />
              <TextInput mode="form" :text="t('guests.email')" v-model="form.email" type="email" />
            </div>
            <div class="form-row">
              <TextInput mode="form" :text="t('guests.phone')" v-model="form.phoneNumber" />
              <TextInput mode="form" :text="t('guests.city')" v-model="form.city" />
            </div>
            <div class="form-row">
              <TextInput mode="form" :text="t('guests.country')" v-model="form.country" />
              <TextInput mode="form" :text="t('guests.zipCode')" v-model="form.zipCode" />
            </div>
            <TextInput mode="form" :text="t('guests.street')" v-model="form.street" />
            <TextareaInput mode="form" :text="t('guests.comment')" v-model="form.comment" />
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn--primary">{{ t('common.save') }}</button>
          </div>
        </form>

        <!-- Non-admin: read-only display -->
        <template v-else>
          <div class="modal__body">
            <div class="info-grid">
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.name') }}</span>
                <span class="info-field__val">{{ guest.name || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.identityDocument') }}</span>
                <span class="info-field__val">{{ guest.identityDocument || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.email') }}</span>
                <span class="info-field__val">{{ guest.email || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.phone') }}</span>
                <span class="info-field__val">{{ guest.phoneNumber || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.city') }}</span>
                <span class="info-field__val">{{ guest.city || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.country') }}</span>
                <span class="info-field__val">{{ guest.country || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.zipCode') }}</span>
                <span class="info-field__val">{{ guest.zipCode || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">{{ t('guests.street') }}</span>
                <span class="info-field__val">{{ guest.street || '—' }}</span>
              </div>
              <div v-if="guest.comment" class="info-field info-field--wide">
                <span class="info-field__label">{{ t('guests.comment') }}</span>
                <span class="info-field__val info-field__val--pre">{{ guest.comment }}</span>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="emit('close')">{{ t('common.close') }}</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

