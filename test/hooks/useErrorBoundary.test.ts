import { renderHook, act } from '@testing-library/react'
import { useErrorBoundary } from '@/hooks'

describe('useErrorBoundary', () => {
  it('should throw error', () => {
    const { result } = renderHook(() => useErrorBoundary())
    expect(() =>
      act(() => result.current.throwError(new Error('test')))
    ).toThrow('test')
  })
})
