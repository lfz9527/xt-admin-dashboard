import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useComposedRef } from '@/hooks'

describe('useComposedRef', () => {
  it('should set object ref', () => {
    const { result } = renderHook(() => {
      const ref = useRef<string | null>(null)
      const composed = useComposedRef(ref)
      return { ref, composed }
    })
    const node = 'test'
    result.current.composed(node)
    expect(result.current.ref.current).toBe(node)
  })

  it('should call callback ref', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useComposedRef(cb))
    const node = {}
    result.current(node)
    expect(cb).toHaveBeenCalledWith(node)
  })

  it('should handle multiple refs', () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<number | null>(null)
      const ref2 = useRef<number | null>(null)
      const composed = useComposedRef(ref1, ref2)
      return { ref1, ref2, composed }
    })
    result.current.composed(42)
    expect(result.current.ref1.current).toBe(42)
    expect(result.current.ref2.current).toBe(42)
  })

  it('should handle null and undefined refs', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useComposedRef(null, undefined, cb))
    expect(() => result.current('ok')).not.toThrow()
    expect(cb).toHaveBeenCalledWith('ok')
  })

  it('should set ref to null', () => {
    const { result } = renderHook(() => {
      const ref = useRef<string | null>('initial')
      const composed = useComposedRef(ref)
      return { ref, composed }
    })
    result.current.composed(null)
    expect(result.current.ref.current).toBeNull()
  })
})
