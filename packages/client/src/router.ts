import { createRouter, createWebHistory } from 'vue-router'
import type { AuthConfig } from './api/client'
import { api, setSessionExpiredHandler } from './api/client'
import { useToast } from './composables/useToast'
import { i18n } from './i18n'

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
    { path: '/login', component: () => import('./pages/auth/LoginPage.vue') },
    { path: '/setup', component: () => import('./pages/auth/SetupPage.vue') },
    {
      path: '/',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/calendar',
      component: () => import('./pages/reservations/CalendarPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reservations',
      component: () => import('./pages/reservations/ReservationsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/guests',
      component: () => import('./pages/guests/GuestsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/config',
      component: () => import('./pages/ConfigPage.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/metrics',
      component: () => import('./pages/metrics/MetricsPage.vue'),
      meta: { requiresAuth: true, adminOnly: true },
    },
    {
      path: '/profile',
      component: () => import('./pages/profile/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/admin', redirect: '/config' },
  ],
})

router.beforeEach(async (to) => {
  // Public routes: always allow
  if (to.path === '/login' || to.path === '/setup') return true

  // Fetch auth config if not cached
  if (!cachedConfig) {
    const cfg = await api.auth.config()
    if (!cfg.ok) {
      return (await api.auth.setupRequired()) ? '/setup' : '/login'
    }
    cachedConfig = cfg
  }

  if (to.meta.adminOnly && !cachedConfig.is_admin) return '/'
  return true
})

/**
 * A 401 on any data call means this session is over — most often because the
 * server was redeployed with a new signing secret, which is what the
 * development server does on every push. Send the operator to the login screen
 * and say why, instead of leaving a mounted page showing zeros it was never
 * allowed to fill.
 */
setSessionExpiredHandler(() => {
  clearCachedConfig()
  if (router.currentRoute.value.path !== '/login') {
    useToast().error(i18n.global.t('errors.sessionExpired'))
    void router.replace('/login')
  }
})

export default router

