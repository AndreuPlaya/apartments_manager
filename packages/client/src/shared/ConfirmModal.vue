<script setup lang="ts">
import { useConfirm } from '../composables/useConfirm'

const { state, respond } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <div v-if="state" class="modal-backdrop" @click.self="respond(false)">
      <div class="modal modal--sm">
        <div class="modal__header">
          <h3>Confirm</h3>
        </div>
        <div class="modal__body">
          <p style="margin: 0; font-size: 0.9rem;">{{ state.message }}</p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="respond(false)">Cancel</button>
          <button class="btn btn--danger" @click="respond(true)">Confirm</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
