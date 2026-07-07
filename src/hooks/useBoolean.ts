import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

type UseBooleanReturn = {
  value: boolean
  setValue: Dispatch<SetStateAction<boolean>>
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
}

/**
 * 处理布尔状态并带有实用函数。
 * @param defaultValue
 * @returns
 */
export function useBoolean(defaultValue = false): UseBooleanReturn {
  if (typeof defaultValue !== 'boolean') {
    throw new Error('defaultValue must be `true` or `false`')
  }
  const [value, setValue] = useState(defaultValue)
  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  const toggle = useCallback(() => {
    setValue((x) => !x)
  }, [])

  return { value, setValue, setTrue, setFalse, toggle }
}
