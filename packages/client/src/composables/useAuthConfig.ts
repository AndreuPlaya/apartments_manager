import { computed, ref } from 'vue'
import { api } from '../api/client'

export interface AuthSession {
  username: string
  isAdmin: boolean
}

/**
 * The authenticated session as `GET /api/auth/config` describes it, kept once
 * for the whole app.
 *
 * It used to be kept four times over: the router guard cached it in a private
 * module variable nobody else could read, `App.vue` re-fetched it on every
 * route change, and each page asked again to learn whether it could show its
 * edit buttons. Two round-trips per navigation, and a cold load of the login
 * screen fired the request twice — the immediate watcher ran against
 * vue-router's START_LOCATION, then again once the real route resolved. Both
 * answers were 401, which is the honest reply to an anonymous visitor but
 * reads like a fault in the browser console.
 *
 * The guard is the only caller that needs to *fetch*. Everything else reads.
 */
const session = ref<AuthSession | null>(null)

/**
 * A cold protected route can have the guard and a mounting page ask at the
 * same time. Sharing the promise makes that one request rather than two.
 */
let pending: Promise<AuthSession | null> | null = null

/** Adopt a session we already know — the reply to a login, setup or profile save. */
export function setAuthConfig(next: AuthSession): void {
  session.value = next
  pending = null
}

/** Forget the session: logout, or a 401 that says the server no longer honours it. */
export function clearAuthConfig(): void {
  session.value = null
  pending = null
}

/**
 * Resolve the session, asking the server only when we do not have it.
 *
 * `null` means anonymous. That arrives as a 401 whose body is the answer, not
 * a failure, so it is read rather than thrown — `api.auth.config` uses a raw
 * fetch for exactly that reason.
 */
export async function ensureAuthConfig(): Promise<AuthSession | null> {
  if (session.value) return session.value
  pending ??= api.auth
    .config()
    .then((cfg) => {
      session.value = cfg.ok ? { username: cfg.username, isAdmin: cfg.is_admin } : null
      return session.value
    })
    .finally(() => {
      pending = null
    })
  return pending
}

export function useAuthConfig() {
  return {
    session: computed(() => session.value),
    username: computed(() => session.value?.username ?? ''),
    isAdmin: computed(() => session.value?.isAdmin ?? false),
    isAuthenticated: computed(() => session.value !== null),
  }
}
