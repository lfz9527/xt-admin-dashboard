import { useEffect, useRef } from 'react'
import { useLatest } from './useLatest'

/**
 * rAF 驱动的定时器，基于 `requestAnimationFrame` + `performance.now()` 累计时间触发回调。
 * 相比 `useInterval`，后台标签页自动暂停无开销，切回前台基于时间差准确恢复，不会出现累计漂移。
 *
 * @param callback - 定时触发的回调函数
 * @param delay - 定时间隔（毫秒），传入负数或 `undefined` 时暂停
 */
export function useRafInterval(callback: () => void, delay?: number) {
  const savedCallback = useLatest(callback)
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (delay == null || delay < 0) {
      return
    }

    lastTimeRef.current = performance.now()

    const tick = () => {
      const now = performance.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= delay) {
        lastTimeRef.current = now - (elapsed % delay)
        savedCallback.current()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [delay])
}
