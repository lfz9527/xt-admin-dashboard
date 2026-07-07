import { renderHook, act } from '@testing-library/react'
import { useScrollLock } from '@/hooks'

describe('useScrollLock', () => {
  it('should lock and unlock', () => {
    const { result } = renderHook(() => useScrollLock({}))
    act(() => result.current.lock())
    expect(result.current.isLocked).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    act(() => result.current.unlock())
    expect(result.current.isLocked).toBe(false)
    expect(document.body.style.overflow).toBe('')
  })

  it('should auto lock when autoLock is true', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: true }))
    expect(result.current.isLocked).toBe(true)
  })

  it('should unlock on unmount', () => {
    const { unmount } = renderHook(() => useScrollLock({ autoLock: true }))
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
