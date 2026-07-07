import { renderHook } from '@testing-library/react'
import { useRafInterval } from '@/hooks'

describe('useRafInterval', () => {
  let rafCallbacks: Map<number, (t: number) => void>
  let rafIdCounter: number
  let now: number
  let cancelledIds: Set<number>

  beforeEach(() => {
    rafCallbacks = new Map()
    rafIdCounter = 1
    now = 0
    cancelledIds = new Set()

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = rafIdCounter++
      rafCallbacks.set(id, cb as (t: number) => void)
      return id
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id)
      cancelledIds.add(id)
    })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const tick = (ms: number) => {
    now += ms
    const cbs = [...rafCallbacks]
    rafCallbacks.clear()
    for (const [id, cb] of cbs) {
      if (!cancelledIds.has(id)) {
        cb(now)
      }
    }
  }

  it('should call callback after delay', () => {
    const fn = vi.fn()
    renderHook(() => useRafInterval(fn, 200))
    tick(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should not run when delay is negative', () => {
    const fn = vi.fn()
    renderHook(() => useRafInterval(fn, -1))
    tick(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('should cancel on unmount', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useRafInterval(fn, 200))
    unmount()
    tick(500)
    expect(fn).not.toHaveBeenCalled()
  })
})
