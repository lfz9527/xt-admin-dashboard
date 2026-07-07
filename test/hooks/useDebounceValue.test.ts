import { renderHook, act } from '@testing-library/react'
import { useDebounceValue } from '@/hooks'

describe('useDebounceValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounceValue('hello'))
    expect(result.current[0]).toBe('hello')
  })

  it('should debounce value update', () => {
    const { result } = renderHook(() => useDebounceValue('a', { delay: 300 }))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('a')
    act(() => vi.advanceTimersByTime(300))
    expect(result.current[0]).toBe('b')
  })

  it('should not update when value is equal', () => {
    const { result } = renderHook(() => useDebounceValue('a', { delay: 100 }))
    act(() => result.current[1]('a'))
    act(() => vi.advanceTimersByTime(100))
    expect(result.current[0]).toBe('a')
  })
})
