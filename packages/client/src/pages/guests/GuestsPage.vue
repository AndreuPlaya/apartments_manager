<script setup lang="ts">
import GuestsTab from './GuestsTab.vue'
import { useAuthConfig } from '../../composables/useAuthConfig'

// The router guard resolved the session before this page mounted.
const { isAdmin } = useAuthConfig()
</script>

<template>
  <div class="page-container">
    <GuestsTab :is-admin="isAdmin" />
  </div>
</template>
