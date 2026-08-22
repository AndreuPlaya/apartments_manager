<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api/client'
import GuestsTab from './GuestsTab.vue'

const isAdmin = ref(false)

onMounted(async () => {
  const cfg = await api.auth.config()
  isAdmin.value = cfg.ok ? cfg.is_admin : false
})
</script>

<template>
  <div class="page-container">
    <GuestsTab :is-admin="isAdmin" />
  </div>
</template>
