import { ref } from 'vue'
import { ApiError } from '../api/client'
import { i18n } from '../i18n'
import { useToast } from './useToast'

export function useAsyncOp() {
  const loading = ref(false)
  const { error } = useToast()

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    try {
      return await fn()
    } catch (e) {
      if (e instanceof ApiError) {
        error(e.message || `Request failed (${e.status})`)
      } else if (e instanceof Error) {
        error(e.message)
      } else {
        error(i18n.global.t('errors.unexpectedError'))
      }
      return undefined
    /* c8 ignore next */
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
