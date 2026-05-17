<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { api } from '../api/client'
import { clearCachedConfig } from '../router'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  username: string
  isAdmin: boolean
}>()

const router = useRouter()
const { error } = useToast()

async function logout() {
  try {
    await api.auth.logout()
    clearCachedConfig()
    router.push('/login')
  } catch {
    error('Logout failed')
  }
}
</script>

<template>
  <nav class="app-nav">
    <div class="app-nav__inner">
      <RouterLink to="/" class="app-nav__brand">Apartments Manager</RouterLink>
      <div class="app-nav__spacer" />
      <RouterLink v-if="props.isAdmin" to="/admin" class="app-nav__link">Admin</RouterLink>
      <RouterLink to="/" class="app-nav__link">Calendar</RouterLink>
      <div class="app-nav__user">
        <span>{{ props.username }}</span>
        <span v-if="props.isAdmin" class="badge badge--admin">Admin</span>
        <button class="btn btn--ghost btn--sm" @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>
