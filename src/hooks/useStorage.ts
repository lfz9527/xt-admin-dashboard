import { useCallback, useEffect, useState } from 'react'

import { useEventListener } from './useEventListener'
import { useLatest } from './useLatest'

type SetValue<T> = Global.OneArgVoidFunction<T | ((v: T) => T)>

type UseStorageReturn<T> = {
  value: T
  remove: VoidFunction
  setValue: SetValue<T>
}

type UseStorageOption<T> = {
  key: string
  storage?: 'session' | 'local'
  /** 初始值，可以是值本身或返回该值的函数 */
  initialValue: T | (() => T)
  /** 序列化函数 */
  deserializer?: (value: string) => T
  /** 序列化 */
  serializer?: (value: T) => string
}

const StorageMap = {
  session: window.sessionStorage,
  local: window.localStorage,
}
export function useStorage<T>(props: UseStorageOption<T>): UseStorageReturn<T> {
  const {
    key,
    storage = 'session',
    initialValue,
    deserializer,
    serializer,
  } = props
  const Storage = useLatest(StorageMap[storage])

  const [storedValue, setStoredValue] = useState(() => {
    return initialValue instanceof Function ? initialValue() : initialValue
  })

  const serializerFn = useCallback<(value: T) => string>(
    (value) => {
      if (serializer) {
        return serializer(value)
      }

      return JSON.stringify(value)
    },
    [serializer]
  )

  const deserializerFn = useCallback<(value: string) => T>(
    (value) => {
      if (deserializer) {
        return deserializer(value)
      }
      // 支持 undefined 作为value
      if (value === 'undefined') {
        return undefined as unknown as T
      }

      const defaultValue =
        initialValue instanceof Function ? initialValue() : initialValue

      let parsed: unknown
      try {
        parsed = JSON.parse(value)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        return defaultValue // 解析失败时,直接返回 默认值
      }

      return parsed as T
    },
    [deserializer, initialValue]
  )

  const readValue = useCallback((): T => {
    const initialValueToUse =
      initialValue instanceof Function ? initialValue() : initialValue

    try {
      const raw = Storage.current.getItem(key)
      return raw ? deserializerFn(raw) : initialValueToUse
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error)
      return initialValueToUse
    }
  }, [initialValue, key, deserializerFn])

  const setValue = useCallback(
    (value) => {
      const newValue = value instanceof Function ? value(readValue()) : value
      Storage.current.setItem(key, serializerFn(newValue))
      setStoredValue(newValue)
    },
    [readValue, key, serializerFn]
  ) as SetValue<T>

  const remove = useCallback(() => {
    const defaultValue =
      initialValue instanceof Function ? initialValue() : initialValue
    Storage.current.removeItem(key)
    setStoredValue(defaultValue)
  }, [key])

  useEffect(() => {
    setStoredValue(readValue())
  }, [key])

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent).key && (event as StorageEvent).key !== key) {
        return
      }
      setStoredValue(readValue())
    },
    [key, readValue]
  )
  // 监听storage 变化
  useEventListener('storage', handleStorageChange)

  return {
    value: storedValue,
    setValue,
    remove,
  }
}
