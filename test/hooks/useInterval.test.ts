import { renderHook, act } from '@testing-library/react'
import { useInterval } from '@/hooks'

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call callback repeatedly', () => {
    const fn = vi.fn()
    renderHook(() => useInterval(fn, 100))
    act(() => vi.advanceTimersByTime(350))
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should not run when delay is negative', () => {
    const fn = vi.fn()
    renderHook(() => useInterval(fn, -1))
    act(() => vi.advanceTimersByTime(1000))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should clear interval on unmount', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useInterval(fn, 100))
    unmount()
    act(() => vi.advanceTimersByTime(500))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should use latest callback', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 100), {
      initialProps: { cb: fn1 },
    })
    rerender({ cb: fn2 })
    act(() => vi.advanceTimersByTime(100))
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
  })
})
