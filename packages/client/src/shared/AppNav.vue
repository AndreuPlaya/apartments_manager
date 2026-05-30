<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/client'
import { clearCachedConfig } from '../router'
import { useToast } from '../composables/useToast'
import { useLocale } from '../composables/useLocale'

const props = defineProps<{
  username: string
  isAdmin: boolean
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { error } = useToast()
const { currentLocale, toggleLocale } = useLocale()

const mobileOpen = ref(false)

const initials = computed(() => {
  const parts = props.username.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : props.username.slice(0, 2).toUpperCase()
})

watch(() => route.path, () => { mobileOpen.value = false })

async function logout() {
  try {
    await api.auth.logout()
    clearCachedConfig()
    router.push('/login')
  } catch {
    error(t('auth.logoutFailed'))
  }
}
</script>

<template>
  <nav class="app-nav">
    <div class="app-nav__inner">
      <!-- Wordmark -->
      <RouterLink to="/" class="app-nav__brand">
        <span class="app-nav__brand-name">Apartments</span>
        <span class="app-nav__brand-sep">|</span>
        <span class="app-nav__brand-sub">Manager</span>
      </RouterLink>

      <!-- Desktop links -->
      <div class="app-nav__links">
        <RouterLink to="/" class="app-nav__link" exact-active-class="app-nav__link--active">
          <!-- Home / dashboard icon -->
          <AppIcon name="home" :size="15" />
          {{ t('nav.dashboard') }}
        </RouterLink>

        <RouterLink to="/calendar" class="app-nav__link" active-class="app-nav__link--active">
          <AppIcon name="calendar" :size="15" />
          {{ t('nav.calendar') }}
        </RouterLink>

        <RouterLink to="/bookings" class="app-nav__link" active-class="app-nav__link--active">
          <AppIcon name="list" :size="15" />
          {{ t('nav.bookings') }}
        </RouterLink>

        <RouterLink to="/clients" class="app-nav__link" active-class="app-nav__link--active">
          <AppIcon name="users" :size="15" />
          {{ t('nav.clients') }}
        </RouterLink>

        <template v-if="props.isAdmin">
          <RouterLink to="/config" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active">
            <AppIcon name="settings" :size="15" />
            {{ t('nav.config') }}
            <span class="app-nav__admin-dot" aria-label="Admin only" />
          </RouterLink>

          <RouterLink to="/metrics" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active">
            <AppIcon name="bar-chart" :size="15" />
            {{ t('nav.metrics') }}
            <span class="app-nav__admin-dot" aria-label="Admin only" />
          </RouterLink>
        </template>
      </div>

      <!-- Desktop user zone -->
      <div class="app-nav__user">
        <div class="app-nav__avatar" :title="props.username">{{ initials }}</div>
        <span class="app-nav__username">{{ props.username }}</span>
        <button
          class="app-nav__locale-toggle"
          :aria-label="currentLocale === 'en' ? 'Switch to Spanish' : 'Switch to English'"
          :title="currentLocale === 'en' ? 'Español' : 'English'"
          @click="toggleLocale"
        >
          {{ currentLocale === 'en' ? 'ES' : 'EN' }}
        </button>
        <button class="app-nav__logout" @click="logout" :aria-label="t('nav.signOut')" :title="t('nav.signOut')">
          <AppIcon name="log-out" :size="16" />
        </button>
      </div>

      <!-- Hamburger (mobile) -->
      <button
        class="app-nav__hamburger"
        :aria-expanded="mobileOpen"
        :aria-label="t('nav.toggleNav')"
        @click="mobileOpen = !mobileOpen"
      >
        <AppIcon v-if="!mobileOpen" name="menu" :size="20" />
        <AppIcon v-else name="x" :size="20" />
      </button>
    </div>

    <!-- Mobile overlay menu -->
    <div :class="['app-nav__mobile-menu', { 'app-nav__mobile-menu--open': mobileOpen }]">
      <RouterLink to="/" class="app-nav__link" exact-active-class="app-nav__link--active" @click="mobileOpen = false">
        <AppIcon name="home" :size="15" />
        {{ t('nav.dashboard') }}
      </RouterLink>
      <RouterLink to="/calendar" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <AppIcon name="calendar" :size="15" />
        {{ t('nav.calendar') }}
      </RouterLink>
      <RouterLink to="/bookings" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <AppIcon name="list" :size="15" />
        {{ t('nav.bookings') }}
      </RouterLink>
      <RouterLink to="/clients" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <AppIcon name="users" :size="15" />
        {{ t('nav.clients') }}
      </RouterLink>

      <template v-if="props.isAdmin">
        <RouterLink to="/config" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active" @click="mobileOpen = false">
          <AppIcon name="settings" :size="15" />
          {{ t('nav.config') }}
          <span class="app-nav__admin-dot" />
        </RouterLink>
        <RouterLink to="/metrics" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active" @click="mobileOpen = false">
          <AppIcon name="bar-chart" :size="15" />
          {{ t('nav.metrics') }}
          <span class="app-nav__admin-dot" />
        </RouterLink>
      </template>

      <div class="app-nav__mobile-user">
        <div class="app-nav__avatar">{{ initials }}</div>
        <span class="app-nav__username">{{ props.username }}</span>
        <button
          class="app-nav__locale-toggle app-nav__locale-toggle--mobile"
          :title="currentLocale === 'en' ? 'Español' : 'English'"
          @click="toggleLocale"
        >
          {{ currentLocale === 'en' ? 'ES' : 'EN' }}
        </button>
        <button class="app-nav__mobile-logout" @click="logout">{{ t('nav.signOut') }}</button>
      </div>
    </div>
  </nav>
</template>
