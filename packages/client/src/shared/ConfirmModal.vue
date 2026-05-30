<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useConfirm } from '../composables/useConfirm'

const { t } = useI18n()
const { state, respond } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <div v-if="state" class="modal-backdrop" @click.self="respond(false)">
      <div class="modal modal--sm">
        <div class="modal__header">
          <h3>{{ t('common.confirm') }}</h3>
        </div>
        <div class="modal__body">
          <p style="margin: 0; font-size: 0.9rem;">{{ state.message }}</p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="respond(false)">{{ t('common.cancel') }}</button>
          <button class="btn btn--danger" @click="respond(true)">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
