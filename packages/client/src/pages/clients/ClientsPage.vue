<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api/client'
import ClientsTab from './ClientsTab.vue'

const isAdmin = ref(false)

onMounted(async () => {
  const cfg = await api.auth.config()
  isAdmin.value = cfg.ok ? cfg.is_admin : false
})
</script>

<template>
  <div class="page-container">
    <ClientsTab :is-admin="isAdmin" />
  </div>
</template>
