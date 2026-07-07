import { renderHook, act } from '@testing-library/react'
import { useTimeout } from '@/hooks'

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call callback after delay', () => {
    const fn = vi.fn()
    renderHook(() => useTimeout(fn, 1000))
    expect(fn).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should not call callback when delay is negative', () => {
    const fn = vi.fn()
    renderHook(() => useTimeout(fn, -1))
    act(() => vi.advanceTimersByTime(5000))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should clear timeout on unmount', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useTimeout(fn, 1000))
    unmount()
    act(() => vi.advanceTimersByTime(1000))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should use latest callback', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { rerender } = renderHook(({ cb }) => useTimeout(cb, 500), {
      initialProps: { cb: fn1 },
    })
    rerender({ cb: fn2 })
    act(() => vi.advanceTimersByTime(500))
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})
