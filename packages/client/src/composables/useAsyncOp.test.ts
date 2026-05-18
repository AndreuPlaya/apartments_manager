import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'

const mockErrorFn = vi.hoisted(() => vi.fn())

vi.mock('./useToast', () => ({
  useToast: () => ({
    toasts: { value: [] },
    success: vi.fn(),
    error: mockErrorFn,
    info: vi.fn(),
    remove: vi.fn(),
  }),
}))

import { useAsyncOp } from './useAsyncOp'

beforeEach(() => {
  mockErrorFn.mockClear()
})

describe('useAsyncOp', () => {
  it('returns the resolved value and resets loading to false', async () => {
    const { loading, run } = useAsyncOp()
    const result = await run(() => Promise.resolve(42))
    expect(result).toBe(42)
    expect(loading.value).toBe(false)
  })

  it('sets loading to true during execution', async () => {
    const { loading, run } = useAsyncOp()
    let loadingDuring = false
    await run(async () => {
      loadingDuring = loading.value
      return 'done'
    })
    expect(loadingDuring).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('shows ApiError message and returns undefined on ApiError', async () => {
    const { run } = useAsyncOp()
    const result = await run(() => Promise.reject(new ApiError(404, 'Not found')))
    expect(result).toBeUndefined()
    expect(mockErrorFn).toHaveBeenCalledWith('Not found')
  })

  it('shows status fallback when ApiError has no message', async () => {
    const { run } = useAsyncOp()
    await run(() => Promise.reject(new ApiError(500, '')))
    expect(mockErrorFn).toHaveBeenCalledWith('Request failed (500)')
  })

  it('shows generic Error message on plain Error', async () => {
    const { run } = useAsyncOp()
    await run(() => Promise.reject(new Error('Network failure')))
    expect(mockErrorFn).toHaveBeenCalledWith('Network failure')
  })

  it('shows unexpected error message for non-Error throws', async () => {
    const { run } = useAsyncOp()
    await run(() => Promise.reject('oops'))
    expect(mockErrorFn).toHaveBeenCalledWith('An unexpected error occurred')
  })

  it('resets loading to false even after an error', async () => {
    const { loading, run } = useAsyncOp()
    await run(() => Promise.reject(new Error('boom')))
    expect(loading.value).toBe(false)
  })

  it('still resets loading to false when the error handler itself throws', async () => {
    mockErrorFn.mockImplementationOnce(() => { throw new Error('toast error') })
    const { loading, run } = useAsyncOp()
    await expect(run(() => Promise.reject(new Error('original')))).rejects.toThrow('toast error')
    expect(loading.value).toBe(false)
  })
})
