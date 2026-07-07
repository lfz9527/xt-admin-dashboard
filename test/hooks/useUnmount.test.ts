import { renderHook } from '@testing-library/react'
import { useUnmount } from '@/hooks'

describe('useUnmount', () => {
  it('should call callback on unmount', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useUnmount(fn))
    expect(fn).not.toHaveBeenCalled()
    unmount()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call latest callback on unmount', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { unmount, rerender } = renderHook(({ cb }) => useUnmount(cb), {
      initialProps: { cb: fn1 },
    })
    rerender({ cb: fn2 })
    unmount()
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})
