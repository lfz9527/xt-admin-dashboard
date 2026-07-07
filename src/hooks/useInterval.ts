import { useEffect } from 'react'

import { useLatest } from './useLatest'

export function useInterval(callback: () => void, delay?: number) {
  const savedCallback = useLatest(callback)

  useEffect(() => {
    if (delay && delay < 0) {
      return
    }

    const id = setInterval(() => {
      savedCallback.current()
    }, delay)

    return () => {
      clearInterval(id)
    }
  }, [delay])
}
