import { renderHook, act } from '@testing-library/react'
import { useCountdown } from '@/hooks'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start at countStart', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 60 }))
    expect(result.current[0]).toBe(60)
  })

  it('should decrement every intervalMs', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 60, intervalMs: 1000 })
    )
    act(() => result.current[1].start!())
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current[0]).toBe(59)
  })

  it('should stop at countStop', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 3, countStop: 0, intervalMs: 100 })
    )
    act(() => result.current[1].start!())
    // 逐 tick 推进，让 React 在每 tick 之间更新 state
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    expect(result.current[0]).toBe(0)
  })

  it('should reset to countStart', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, intervalMs: 100 })
    )
    act(() => result.current[1].start!())
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current[1].reset!())
    expect(result.current[0]).toBe(10)
  })

  it('should increment when isIncrement is true', () => {
    const { result } = renderHook(() =>
      useCountdown({
        countStart: 0,
        countStop: 5,
        isIncrement: true,
        intervalMs: 100,
      })
    )
    act(() => result.current[1].start!())
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    act(() => vi.advanceTimersByTime(100))
    expect(result.current[0]).toBe(5)
  })
})
