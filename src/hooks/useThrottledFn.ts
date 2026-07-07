import { useRef, useCallback } from 'react'

import { useLatest } from './useLatest'
import { useUnmount } from './useUnmount'

type UseThrottleFnOptions = {
  wait?: number // 节流间隔，默认 1000ms
  leading?: boolean // 是否在间隔开始时立即执行，默认 true 确保获取第一次
  trailing?: boolean // 是否在间隔结束后执行最后一次调用，默认 true  确保能获取最后一次
}

export function useThrottleFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: UseThrottleFnOptions
): (...args: Parameters<T>) => void {
  const { wait = 500 } = options || {}
  const fnRef = useLatest(fn)

  const lastCallTime = useRef<number>(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgs = useRef<Parameters<T> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
    }
  }, [])

  const run = useCallback((...args: Parameters<T>) => {
    clearTimer()
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current
    const delay = wait - timeSinceLastCall
    lastArgs.current = args

    if (delay <= 0) {
      lastCallTime.current = now
      fnRef.current(...args)
    } else {
      timer.current = setTimeout(() => {
        lastCallTime.current = Date.now()
        fnRef.current(...args)
      }, delay)
    }
  }, [])

  useUnmount(() => {
    clearTimer()
  })

  return run
}
