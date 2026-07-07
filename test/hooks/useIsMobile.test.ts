import { renderHook } from '@testing-library/react'
import { useIsMobile } from '@/hooks'

describe('useIsMobile', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let matchMediaImpl: (query: string) => MediaQueryList

  beforeEach(() => {
    listeners = []
    matchMediaImpl = (query) =>
      ({
        matches: query.includes('767'),
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
          listeners.push(cb),
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
    window.matchMedia = matchMediaImpl
  })

  afterEach(() => {
    listeners = []
  })

  it('should detect mobile when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should detect desktop when width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
