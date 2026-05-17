import { createRouter, createWebHistory } from 'vue-router'
import type { AuthConfig } from './api/client'
import { api, ApiError } from './api/client'

let cachedConfig: (AuthConfig & { ok: true }) | null = null

export function clearCachedConfig() {
  cachedConfig = null
}

export function setCachedConfig(cfg: AuthConfig & { ok: true }) {
  cachedConfig = cfg
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./pages/LoginPage.vue') },
    { path: '/setup', component: () => import('./pages/SetupPage.vue') },
    {
      path: '/',
      component: () => import('./pages/MainPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('./pages/AdminPage.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
  ],
})

router.beforeEach(async (to) => {
  // Public routes: always allow
  if (to.path === '/login' || to.path === '/setup') return true

  // Fetch auth config if not cached
  if (!cachedConfig) {
    const cfg = await api.auth.config()
    if (!cfg.ok) {
      // Not authenticated — check if first-run setup needed
      try {
        await api.apartments.list()
      } catch (e) {
        if (e instanceof ApiError && e.status === 503) return '/setup'
      }
      return '/login'
    }
    cachedConfig = cfg
  }

  if (to.meta.adminOnly && !cachedConfig.is_admin) return '/'
  return true
})

export default router
