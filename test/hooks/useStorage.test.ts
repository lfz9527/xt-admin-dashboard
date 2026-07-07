import { renderHook, act } from '@testing-library/react'
import { useStorage } from '@/hooks'

describe('useStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('should use initial value when no stored value', () => {
    const { result } = renderHook(() =>
      useStorage({ key: 'test', initialValue: 'default' })
    )
    expect(result.current.value).toBe('default')
  })

  it('should read existing value from storage', () => {
    sessionStorage.setItem('pref', JSON.stringify('saved'))
    const { result } = renderHook(() =>
      useStorage({ key: 'pref', initialValue: 'default' })
    )
    expect(result.current.value).toBe('saved')
  })

  it('should set value and persist to storage', () => {
    const { result } = renderHook(() =>
      useStorage({ key: 'k', initialValue: '' })
    )
    act(() => result.current.setValue('updated'))
    expect(result.current.value).toBe('updated')
    expect(JSON.parse(sessionStorage.getItem('k')!)).toBe('updated')
  })

  it('should remove value and reset to default', () => {
    sessionStorage.setItem('del', JSON.stringify('stored'))
    const { result } = renderHook(() =>
      useStorage({ key: 'del', initialValue: 'default' })
    )
    act(() => result.current.remove())
    expect(result.current.value).toBe('default')
    expect(sessionStorage.getItem('del')).toBeNull()
  })

  it('should support localStorage', () => {
    localStorage.clear()
    const { result } = renderHook(() =>
      useStorage({ key: 'local', storage: 'local', initialValue: 0 })
    )
    act(() => result.current.setValue(42))
    expect(JSON.parse(localStorage.getItem('local')!)).toBe(42)
    localStorage.clear()
  })

  it('should support function initialValue', () => {
    const { result } = renderHook(() =>
      useStorage({ key: 'fn', initialValue: () => 'computed' })
    )
    expect(result.current.value).toBe('computed')
  })
})
