import { beforeEach, describe, expect, it } from 'vitest'
import { useConfirm } from '../../src/composables/useConfirm'

beforeEach(() => {
  // Reset module-level state
  const { state } = useConfirm()
  state.value = null
})

describe('useConfirm', () => {
  it('confirm() returns a Promise and sets state with the message', () => {
    const { state, confirm } = useConfirm()
    const promise = confirm('Are you sure?')
    expect(promise).toBeInstanceOf(Promise)
    expect(state.value?.message).toBe('Are you sure?')
  })

  it('respond(true) resolves the promise with true and clears state', async () => {
    const { state, confirm, respond } = useConfirm()
    const promise = confirm('Delete?')
    respond(true)
    const result = await promise
    expect(result).toBe(true)
    expect(state.value).toBeNull()
  })

  it('respond(false) resolves the promise with false and clears state', async () => {
    const { confirm, respond } = useConfirm()
    const promise = confirm('Cancel?')
    respond(false)
    const result = await promise
    expect(result).toBe(false)
  })
})
