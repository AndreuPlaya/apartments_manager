import { ref } from 'vue'

interface ConfirmState {
  message: string
  resolve: (value: boolean) => void
}

const state = ref<ConfirmState | null>(null)

export function useConfirm() {
  function confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = { message, resolve }
    })
  }

  function respond(value: boolean) {
    state.value?.resolve(value)
    state.value = null
  }

  return { state, confirm, respond }
}
