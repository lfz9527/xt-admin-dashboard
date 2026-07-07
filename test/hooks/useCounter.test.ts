import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks'

describe('useCounter', () => {
  it('should default to 0', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('should accept initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('should increment by 1 by default', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })

  it('should increment by custom amount', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.increment(5))
    expect(result.current.count).toBe(5)
  })

  it('should decrement by 1 by default', () => {
    const { result } = renderHook(() => useCounter(5))
    act(() => result.current.decrement())
    expect(result.current.count).toBe(4)
  })

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    act(() => {
      result.current.increment(5)
    })
    expect(result.current.count).toBe(15)
    act(() => result.current.reset())
    expect(result.current.count).toBe(10)
  })

  it('should set count directly', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.setCount(42))
    expect(result.current.count).toBe(42)
  })
})
