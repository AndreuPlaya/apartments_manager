<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from './shared/AppNav.vue'
import ToastContainer from './shared/ToastContainer.vue'
import ConfirmModal from './shared/ConfirmModal.vue'
import { api } from './api/client'

const route = useRoute()
const username = ref('')
const isAdmin = ref(false)
const showNav = ref(false)

async function loadConfig() {
  const cfg = await api.auth.config()
  if (cfg.ok) {
    username.value = cfg.username
    isAdmin.value = cfg.is_admin
    showNav.value = true
  } else {
    showNav.value = false
  }
}

watch(() => route.path, loadConfig, { immediate: true })
</script>

<template>
  <AppNav v-if="showNav" :username="username" :is-admin="isAdmin" />
  <main style="padding: 1.25rem 0">
    <RouterView />
  </main>
  <ToastContainer />
  <ConfirmModal />
</template>
