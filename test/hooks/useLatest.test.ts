import { renderHook } from '@testing-library/react'
import { useLatest } from '@/hooks'

describe('useLatest', () => {
  it('should return latest value', () => {
    const { result, rerender } = renderHook(({ v }) => useLatest(v), {
      initialProps: { v: 1 },
    })
    expect(result.current.current).toBe(1)
    rerender({ v: 2 })
    expect(result.current.current).toBe(2)
  })
})
