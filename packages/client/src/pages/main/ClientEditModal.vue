<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Client } from '../../api/client'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps<{
  client: Client
  isAdmin: boolean
}>()

const emit = defineEmits<{
  save: [client: Client, patch: Partial<Omit<Client, 'id'>>]
  close: []
}>()

const form = ref({ ...props.client })

watch(() => props.client, (c) => { form.value = { ...c } }, { immediate: true })

function save() {
  const fields: (keyof Omit<Client, 'id'>)[] = [
    'name', 'identityDocument', 'email', 'phoneNumber',
    'street', 'city', 'country', 'zipCode', 'comment',
  ]
  const patch: Partial<Omit<Client, 'id'>> = {}
  for (const f of fields) {
    const val = (form.value[f] as string | undefined)?.trim() || undefined
    if (val !== props.client[f]) patch[f] = val
  }
  if (Object.keys(patch).length > 0) emit('save', props.client, patch)
  else emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal modal--lg">
        <div class="modal__header">
          <h3>{{ isAdmin ? 'Edit client' : 'Client info' }}</h3>
          <button class="btn btn--ghost btn--sm" @click="emit('close')"><AppIcon name="x" /></button>
        </div>

        <!-- Admin: editable form -->
        <form v-if="isAdmin" @submit.prevent="save">
          <div class="modal__body">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="form.name" type="text" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Identity document</label>
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
                <label>City</label>
                <input v-model="form.city" type="text" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Country</label>
                <input v-model="form.country" type="text" />
              </div>
              <div class="form-group">
                <label>ZIP code</label>
                <input v-model="form.zipCode" type="text" />
              </div>
            </div>
            <div class="form-group">
              <label>Street</label>
              <input v-model="form.street" type="text" />
            </div>
            <div class="form-group">
              <label>Comment</label>
              <textarea v-model="form.comment" rows="2" />
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="emit('close')">Cancel</button>
            <button type="submit" class="btn btn--primary">Save</button>
          </div>
        </form>

        <!-- Non-admin: read-only display -->
        <template v-else>
          <div class="modal__body">
            <div class="info-grid">
              <div class="info-field">
                <span class="info-field__label">Name</span>
                <span class="info-field__val">{{ client.name || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">Identity document</span>
                <span class="info-field__val">{{ client.identityDocument || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">Email</span>
                <span class="info-field__val">{{ client.email || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">Phone</span>
                <span class="info-field__val">{{ client.phoneNumber || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">City</span>
                <span class="info-field__val">{{ client.city || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">Country</span>
                <span class="info-field__val">{{ client.country || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">ZIP code</span>
                <span class="info-field__val">{{ client.zipCode || '—' }}</span>
              </div>
              <div class="info-field">
                <span class="info-field__label">Street</span>
                <span class="info-field__val">{{ client.street || '—' }}</span>
              </div>
              <div v-if="client.comment" class="info-field info-field--wide">
                <span class="info-field__label">Comment</span>
                <span class="info-field__val info-field__val--pre">{{ client.comment }}</span>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="emit('close')">Close</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.25rem;
}

@media (max-width: 480px) {
  .info-grid { grid-template-columns: 1fr; }
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-field--wide {
  grid-column: 1 / -1;
}

.info-field__label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.info-field__val {
  font-size: 0.875rem;
  color: var(--text);
}

.info-field__val--pre {
  white-space: pre-wrap;
}
</style>
