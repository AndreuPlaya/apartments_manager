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
          {{ t('nav.home') }}
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
        {{ t('nav.home') }}
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

<style lang="scss">
@use '../styles/variables' as *;

.app-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
}

.app-nav__inner {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: var(--nav-height);
  padding: 0 1.25rem;
  max-width: 1600px;
  margin: 0 auto;
}

// Brand
.app-nav__brand {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  text-decoration: none;
  margin-right: 1.25rem;
  flex-shrink: 0;
}
.app-nav__brand-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--nav-text-bright);
  letter-spacing: 0.01em;
}
.app-nav__brand-sep {
  color: var(--nav-border);
  font-weight: 300;
}
.app-nav__brand-sub {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--nav-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

// Links
.app-nav__links {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex: 1;
}

.app-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--nav-text);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;

  svg { flex-shrink: 0; opacity: 0.75; transition: opacity 0.15s; }

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    color: var(--nav-text-bright);
    svg { opacity: 1; }
  }

  &--active {
    color: var(--nav-text-bright) !important;
    background: rgba(59, 130, 246, 0.18) !important;
    svg { opacity: 1 !important; }
  }

  &--admin {
    color: var(--nav-text);
  }
}

// Tiny amber dot for admin-only links
.app-nav__admin-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  margin-left: 1px;
  opacity: 0.85;
}

// User zone
.app-nav__user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  padding-left: 1rem;
  flex-shrink: 0;
}

.app-nav__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--nav-avatar-bg);
  color: var(--nav-text-bright);
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.app-nav__username {
  font-size: 0.8rem;
  color: var(--nav-text);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-nav__locale-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--nav-text);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--nav-text-bright);
  }

  &--mobile {
    width: auto;
    padding: 0 0.5rem;
    border-color: rgba(255, 255, 255, 0.15);
  }
}

.app-nav__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--nav-text);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255,255,255,0.08);
    color: var(--nav-text-bright);
  }
}

// Hamburger
.app-nav__hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--nav-text);
  border-radius: 6px;
  cursor: pointer;
  margin-left: auto;
  transition: background 0.15s;

  &:hover { background: rgba(255,255,255,0.08); }
}

// Mobile menu
.app-nav__mobile-menu {
  display: none;
  flex-direction: column;
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid var(--nav-border);
  gap: 0.125rem;

  &--open { display: flex; }

  .app-nav__link {
    padding: 0.55rem 0.75rem;
    font-size: 0.9rem;
  }
}

.app-nav__mobile-user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--nav-border);
}

.app-nav__mobile-logout {
  margin-left: auto;
  padding: 0.3rem 0.75rem;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: var(--nav-text);
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255,255,255,0.08);
    color: var(--nav-text-bright);
  }
}

// Responsive
@media (max-width: 768px) {
  .app-nav__links,
  .app-nav__user { display: none; }
  .app-nav__hamburger { display: flex; }
}
</style>
