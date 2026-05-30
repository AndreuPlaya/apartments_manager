import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '../../src/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  // Reset module-level state between tests
  const { toasts } = useToast()
  toasts.value = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  it('success() adds a toast with type success', () => {
    const { toasts, success } = useToast()
    success('Operation succeeded')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.message).toBe('Operation succeeded')
    expect(toasts.value[0]!.type).toBe('success')
  })

  it('error() adds a toast with type error', () => {
    const { toasts, error } = useToast()
    error('Something broke')
    expect(toasts.value[0]!.type).toBe('error')
  })

  it('info() adds a toast with type info', () => {
    const { toasts, info } = useToast()
    info('FYI')
    expect(toasts.value[0]!.type).toBe('info')
  })

  it('auto-removes success toast after 3500ms', () => {
    const { toasts, success } = useToast()
    success('Done')
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(3500)
    expect(toasts.value).toHaveLength(0)
  })

  it('auto-removes error toast after 5000ms', () => {
    const { toasts, error } = useToast()
    error('Error!')
    vi.advanceTimersByTime(4999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('remove() removes a specific toast by id', () => {
    const { toasts, success, remove } = useToast()
    success('First')
    success('Second')
    const id = toasts.value[0]!.id
    remove(id)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.message).toBe('Second')
  })

  it('remove() is a no-op for unknown id', () => {
    const { toasts, success, remove } = useToast()
    success('Hello')
    remove(9999)
    expect(toasts.value).toHaveLength(1)
  })

  it('assigns auto-incrementing ids', () => {
    const { toasts, info } = useToast()
    info('A')
    info('B')
    const ids = toasts.value.map((t) => t.id)
    expect(ids[0]).toBeLessThan(ids[1]!)
  })
})
