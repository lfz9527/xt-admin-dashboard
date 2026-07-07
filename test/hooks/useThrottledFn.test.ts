import { renderHook, act } from '@testing-library/react'
import { useThrottleFn } from '@/hooks'

describe('useThrottleFn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call immediately on first invocation', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))
    act(() => result.current('a'))
    expect(fn).toHaveBeenCalledWith('a')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should throttle subsequent calls', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))
    act(() => result.current('a'))
    act(() => result.current('b'))
    act(() => result.current('c'))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('should call with latest args after delay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useThrottleFn(fn, { wait: 300 }))
    act(() => {
      result.current('a')
      vi.advanceTimersByTime(50)
      result.current('b')
    })
    act(() => vi.advanceTimersByTime(300))
    expect(fn).toHaveBeenCalledWith('b')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
