import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useEventListener } from '@/hooks'

describe('useEventListener', () => {
  it('should listen to window events', () => {
    const fn = vi.fn()
    renderHook(() => useEventListener('click', fn))
    window.dispatchEvent(new Event('click'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should listen to element events', () => {
    const fn = vi.fn()
    const el = document.createElement('div')
    renderHook(() => {
      const ref = useRef(el)
      useEventListener('click', fn, ref)
    })
    el.click()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should use latest handler', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { rerender } = renderHook(({ cb }) => useEventListener('click', cb), {
      initialProps: { cb: fn1 },
    })
    rerender({ cb: fn2 })
    window.dispatchEvent(new Event('click'))
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})
