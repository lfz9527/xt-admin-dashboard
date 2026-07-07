import { renderHook, act } from '@testing-library/react'
import { useRequest } from '@/hooks'
import type { ServiceFn } from '@/hooks/useRequest'
import type { BusResponse } from '@/service/request'

function mockService<T>(data: T, delay = 0): ServiceFn<T, [number]> {
  return vi.fn(
    (_id: number, signal?: AbortSignal) =>
      new Promise<BusResponse<T>>((resolve, reject) => {
        const timer = setTimeout(
          () => resolve({ code: 0, data, message: 'ok' }),
          delay
        )
        signal?.addEventListener('abort', () => {
          clearTimeout(timer)
          const err = new Error('aborted') as Error & { isAborted: boolean }
          err.isAborted = true
          reject(err)
        })
      })
  )
}

describe('useRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should auto-fetch on mount when immediate is true', async () => {
    const svc = mockService('hello')
    const { result } = renderHook(() => useRequest(svc, { defaultParams: [1] }))
    expect(result.current.loading).toBe(true)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('hello')
  })

  it('should not fetch when immediate is false', () => {
    const svc = mockService('x')
    const { result } = renderHook(() => useRequest(svc, { immediate: false }))
    expect(result.current.loading).toBe(false)
    expect(svc).not.toHaveBeenCalled()
  })

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const svc = mockService('ok')
    renderHook(() =>
      useRequest(svc, { defaultParams: [1] as [number], onSuccess })
    )
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(onSuccess).toHaveBeenCalledWith('ok', [1])
  })

  it('should call onError callback on failure', async () => {
    const onError = vi.fn()
    const svc: ServiceFn<unknown, [number]> = vi.fn(() =>
      Promise.reject(Object.assign(new Error('fail'), { status: 500 }))
    )
    renderHook(() =>
      useRequest(svc, { defaultParams: [1] as [number], onError })
    )
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(onError).toHaveBeenCalled()
  })

  it('should run manually', async () => {
    const svc = mockService('manual')
    const { result } = renderHook(() => useRequest(svc, { immediate: false }))
    act(() => result.current.run(42))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(svc).toHaveBeenCalledWith(42, expect.any(AbortSignal))
  })

  it('should cancel previous request on re-run', async () => {
    const svc = mockService('first', 1000)
    const { result } = renderHook(() => useRequest(svc, { immediate: false }))
    act(() => result.current.run(1))
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.run(2)
    })
    await act(() => vi.advanceTimersByTimeAsync(1000))
    // Only the second call completes, first is aborted
    expect(svc).toHaveBeenCalledTimes(2)
  })

  it('should mutate data optimistically', () => {
    const svc = mockService('old')
    const { result } = renderHook(() => useRequest(svc, { immediate: false }))
    act(() => result.current.mutate('optimistic'))
    expect(result.current.data).toBe('optimistic')
  })

  it('should refresh with last params', async () => {
    const svc = mockService('refreshed')
    const { result } = renderHook(() => useRequest(svc, { immediate: false }))
    act(() => result.current.run(10))
    await act(() => vi.advanceTimersByTimeAsync(0))
    act(() => result.current.refresh())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(svc).toHaveBeenCalledTimes(2)
  })
})
