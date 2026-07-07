import { renderHook, act } from '@testing-library/react'
import { useBoolean } from '@/hooks'

describe('useBoolean', () => {
  it('should default to false', () => {
    const { result } = renderHook(() => useBoolean())
    expect(result.current.value).toBe(false)
  })

  it('should accept initial value', () => {
    const { result } = renderHook(() => useBoolean(true))
    expect(result.current.value).toBe(true)
  })

  it('should toggle value', () => {
    const { result } = renderHook(() => useBoolean(false))
    act(() => result.current.toggle())
    expect(result.current.value).toBe(true)
  })

  it('should set true', () => {
    const { result } = renderHook(() => useBoolean(false))
    act(() => result.current.setTrue())
    expect(result.current.value).toBe(true)
  })

  it('should set false', () => {
    const { result } = renderHook(() => useBoolean(true))
    act(() => result.current.setFalse())
    expect(result.current.value).toBe(false)
  })

  it('should throw on non-boolean default', () => {
    expect(() => renderHook(() => useBoolean('true' as never))).toThrow()
  })
})
