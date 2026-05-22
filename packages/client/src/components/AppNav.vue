<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { api } from '../api/client'
import { clearCachedConfig } from '../router'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  username: string
  isAdmin: boolean
}>()

const router = useRouter()
const route = useRoute()
const { error } = useToast()

const dropdownOpen = ref(false)
const mobileOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const adminTabs = [
  { label: 'Apartments', value: 'apartments' },
  { label: 'Clients',    value: 'clients' },
  { label: 'Channels',   value: 'channels' },
  { label: 'Users',      value: 'users' },
  { label: 'Metrics',    value: 'metrics' },
]

const initials = computed(() => {
  const parts = props.username.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : props.username.slice(0, 2).toUpperCase()
})

const currentAdminTab = computed(() => {
  if (route.path !== '/admin') return ''
  return (route.query.tab as string) || 'apartments'
})

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

watch(() => route.path, () => { mobileOpen.value = false })

onMounted(() => document.addEventListener('click', onClickOutside, true))
onUnmounted(() => document.removeEventListener('click', onClickOutside, true))

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
    <!-- Desktop bar -->
    <div class="app-nav__inner">
      <!-- Wordmark -->
      <RouterLink to="/" class="app-nav__brand">
        <span class="app-nav__brand-name">Apartments</span>
        <span class="app-nav__brand-sep">|</span>
        <span class="app-nav__brand-sub">Manager</span>
      </RouterLink>

      <!-- Desktop links -->
      <div class="app-nav__links">
        <RouterLink to="/" class="app-nav__link">Calendar</RouterLink>

        <div v-if="props.isAdmin" class="app-nav__dropdown" ref="dropdownRef">
          <button
            class="app-nav__dropdown-trigger"
            :aria-expanded="dropdownOpen"
            aria-haspopup="true"
            @click="dropdownOpen = !dropdownOpen"
          >
            Admin
            <svg
              class="app-nav__dropdown-chevron"
              :class="{ 'app-nav__dropdown-chevron--open': dropdownOpen }"
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <div v-if="dropdownOpen" class="app-nav__dropdown-menu">
            <RouterLink
              v-for="tab in adminTabs"
              :key="tab.value"
              :to="`/admin?tab=${tab.value}`"
              class="app-nav__dropdown-item"
              :class="{ 'app-nav__dropdown-item--active': currentAdminTab === tab.value }"
              @click="dropdownOpen = false"
            >
              {{ tab.label }}
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Desktop user zone -->
      <div class="app-nav__user">
        <div class="app-nav__avatar" :title="props.username">{{ initials }}</div>
        <span class="app-nav__username">{{ props.username }}</span>
        <button class="app-nav__logout" @click="logout" aria-label="Sign out" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Hamburger (mobile) -->
      <button
        class="app-nav__hamburger"
        :aria-expanded="mobileOpen"
        aria-label="Toggle navigation"
        @click="mobileOpen = !mobileOpen"
      >
        <svg v-if="!mobileOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Mobile overlay menu -->
    <div :class="['app-nav__mobile-menu', { 'app-nav__mobile-menu--open': mobileOpen }]">
      <RouterLink to="/" class="app-nav__link" @click="mobileOpen = false">Calendar</RouterLink>

      <template v-if="props.isAdmin">
        <div class="app-nav__mobile-section">Admin</div>
        <RouterLink
          v-for="tab in adminTabs"
          :key="tab.value"
          :to="`/admin?tab=${tab.value}`"
          class="app-nav__mobile-sub"
          @click="mobileOpen = false"
        >
          {{ tab.label }}
        </RouterLink>
      </template>

      <div class="app-nav__mobile-user">
        <div class="app-nav__avatar">{{ initials }}</div>
        <span class="app-nav__username">{{ props.username }}</span>
        <button class="app-nav__mobile-logout" @click="logout">Sign out</button>
      </div>
    </div>
  </nav>
</template>
