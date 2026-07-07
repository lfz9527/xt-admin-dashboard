import { renderHook, act } from '@testing-library/react'
import { useDebounceFn } from '@/hooks'

describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not call immediately by default', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounceFn(fn, { delay: 300 }))
    act(() => result.current.run('a'))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should call after delay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounceFn(fn, { delay: 300 }))
    act(() => result.current.run('a'))
    act(() => vi.advanceTimersByTime(300))
    expect(fn).toHaveBeenCalledWith('a')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should debounce multiple calls within delay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounceFn(fn, { delay: 300 }))
    act(() => {
      result.current.run('a')
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.run('b')
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.run('c')
    })
    act(() => vi.advanceTimersByTime(300))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('should call immediately with leading', () => {
    const fn = vi.fn()
    const { result } = renderHook(() =>
      useDebounceFn(fn, { leading: true, trailing: false, delay: 300 })
    )
    act(() => result.current.run('x'))
    expect(fn).toHaveBeenCalledWith('x')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should cancel pending call', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounceFn(fn, { delay: 300 }))
    act(() => result.current.run('a'))
    act(() => result.current.cancel())
    act(() => vi.advanceTimersByTime(300))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should flush pending call immediately', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounceFn(fn, { delay: 300 }))
    act(() => result.current.run('flush'))
    act(() => result.current.flush())
    expect(fn).toHaveBeenCalledWith('flush')
  })
})
