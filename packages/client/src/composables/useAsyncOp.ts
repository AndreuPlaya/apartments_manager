import { ref } from 'vue'
import { ApiError } from '../api/client'
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
        error('An unexpected error occurred')
      }
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
