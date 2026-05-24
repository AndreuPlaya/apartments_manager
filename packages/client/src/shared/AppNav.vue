<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
    error('Logout failed')
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </RouterLink>

        <RouterLink to="/calendar" class="app-nav__link" active-class="app-nav__link--active">
          <!-- Calendar icon -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Calendar
        </RouterLink>

        <RouterLink to="/bookings" class="app-nav__link" active-class="app-nav__link--active">
          <!-- List icon -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Bookings
        </RouterLink>

        <RouterLink to="/clients" class="app-nav__link" active-class="app-nav__link--active">
          <!-- People icon -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Clients
        </RouterLink>

        <template v-if="props.isAdmin">
          <RouterLink to="/config" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active">
            <!-- Settings icon -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Config
            <span class="app-nav__admin-dot" aria-label="Admin only" />
          </RouterLink>

          <RouterLink to="/metrics" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active">
            <!-- Bar chart icon -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Metrics
            <span class="app-nav__admin-dot" aria-label="Admin only" />
          </RouterLink>
        </template>
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
      <RouterLink to="/" class="app-nav__link" exact-active-class="app-nav__link--active" @click="mobileOpen = false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Home
      </RouterLink>
      <RouterLink to="/calendar" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Calendar
      </RouterLink>
      <RouterLink to="/bookings" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Bookings
      </RouterLink>
      <RouterLink to="/clients" class="app-nav__link" active-class="app-nav__link--active" @click="mobileOpen = false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Clients
      </RouterLink>

      <template v-if="props.isAdmin">
        <RouterLink to="/config" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active" @click="mobileOpen = false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Config
          <span class="app-nav__admin-dot" />
        </RouterLink>
        <RouterLink to="/metrics" class="app-nav__link app-nav__link--admin" active-class="app-nav__link--active" @click="mobileOpen = false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Metrics
          <span class="app-nav__admin-dot" />
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
