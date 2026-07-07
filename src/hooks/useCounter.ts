import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

type UseCounterReturn = {
  count: number
  increment: (n?: number) => void
  decrement: (n?: number) => void
  reset: () => void
  setCount: Dispatch<SetStateAction<number>>
}

export function useCounter(initialValue?: number): UseCounterReturn {
  const [count, setCount] = useState(initialValue ?? 0)

  const increment = useCallback((n = 1) => {
    setCount((x) => x + n)
  }, [])

  const decrement = useCallback((n = 1) => {
    setCount((x) => x - n)
  }, [])

  const reset = useCallback(() => {
    setCount(initialValue ?? 0)
  }, [initialValue])

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
  }
}
