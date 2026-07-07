import { useCounter } from './useCounter'
import { useBoolean } from './useBoolean'
import { useInterval } from './useInterval'
import { useCallback } from 'react'

type UseCountdownReturn = [count: number, action: CountdownControllers]

type CountdownControllers = {
  start?: VoidFunction
  stop?: VoidFunction
  reset?: VoidFunction
}

type UseCountdownOptions = {
  countStart: number
  countStop?: number
  intervalMs?: number
  isIncrement?: boolean
}

/**
 *
 * @param fn 执行函数
 * @param {number} [options.countStart] - 倒计时的起始数字
 * @param {number} [options.countStop=0] - 倒计时的结束数字
 * @param {number} [options.intervalMs=1000] - 倒计时的间隔，以毫秒计。Default ts 1000
 * @param {number} [options.isIncrement=false] - 倒计时是默认递减
 * @returns
 */
export function useCountdown({
  countStart,
  countStop = 0,
  intervalMs = 1000,
  isIncrement = false,
}: UseCountdownOptions): UseCountdownReturn {
  const {
    count,
    increment,
    decrement,
    reset: resetCounter,
  } = useCounter(countStart)

  const {
    value: isCountdownRunning,
    setTrue: start,
    setFalse: stop,
  } = useBoolean(false)

  const resetCount = useCallback(() => {
    resetCounter()
    stop()
  }, [stop, resetCounter])

  const countdownCallback = useCallback(() => {
    if (count === countStop) {
      stop()
      return
    }
    if (isIncrement) {
      increment()
    } else {
      decrement()
    }
  }, [count, countStop, decrement, increment, isIncrement, stop])

  useInterval(countdownCallback, isCountdownRunning ? intervalMs : -1)

  return [
    count,
    {
      start,
      stop,
      reset: resetCount,
    },
  ]
}
