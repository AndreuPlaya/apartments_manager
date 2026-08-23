<script setup lang="ts">
import AppNav from './shared/AppNav.vue'
import ToastContainer from './shared/ToastContainer.vue'
import ConfirmModal from './shared/ConfirmModal.vue'
import { useAuthConfig } from './composables/useAuthConfig'

// The nav follows the session, not the route. The router guard has already
// resolved the session before any authenticated page renders, and the login
// screen leaves it null — so there is nothing here left to fetch. Watching
// `route.path` instead cost a request per navigation, and two on a cold load.
const { username, isAdmin, isAuthenticated } = useAuthConfig()
</script>

<template>
  <AppNav v-if="isAuthenticated" :username="username" :is-admin="isAdmin" />
  <main style="padding: 1.25rem 0">
    <RouterView />
  </main>
  <ToastContainer />
  <ConfirmModal />
</template>
