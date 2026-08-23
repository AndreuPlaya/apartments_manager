import { ref } from 'vue'
import { ApiError, SessionExpiredError, StaleClientError } from '../api/client'
import { i18n } from '../i18n'
import { useToast } from './useToast'

/**
 * Turns a caught error into the one message the operator can act on. Shared
 * with the pages that load their own data, so a failure reads the same however
 * it was triggered.
 */
export function reportError(e: unknown): void {
  const { error } = useToast()
  if (e instanceof SessionExpiredError) {
    // The router already redirects to the login screen and says why. A second
    // toast reading "Unauthorized" would only add noise.
    return
  }
  if (e instanceof StaleClientError) {
    // The server's message names an endpoint, which means nothing to whoever
    // is at the desk. What they can act on is: reload.
    error(i18n.global.t('errors.staleClient'))
  } else if (e instanceof ApiError) {
    error(e.message || `Request failed (${e.status})`)
  } else if (e instanceof Error) {
    error(e.message)
  } else {
    error(i18n.global.t('errors.unexpectedError'))
  }
}

export function useAsyncOp() {
  const loading = ref(false)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    try {
      return await fn()
    } catch (e) {
      reportError(e)
      return undefined
    /* c8 ignore next */
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
