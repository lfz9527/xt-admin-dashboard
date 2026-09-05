import { useCallback, useState } from 'react'

import type { TreeKeyValue } from '@/utils/tree'

export type TreeKey = string

function normalizeKeys(keys: readonly TreeKeyValue[]): TreeKey[] {
  return [...new Set(keys.map(String))]
}

export function useTreeState({
  defaultExpandedKeys = [],
  defaultSelectedKeys = [],
}: {
  defaultExpandedKeys?: readonly TreeKeyValue[]
  defaultSelectedKeys?: readonly TreeKeyValue[]
} = {}) {
  const [expandedKeys, setExpandedKeysState] = useState<TreeKey[]>(() =>
    normalizeKeys(defaultExpandedKeys)
  )
  const [selectedKeys, setSelectedKeysState] = useState<TreeKey[]>(() =>
    normalizeKeys(defaultSelectedKeys)
  )

  const setExpandedKeys = useCallback((keys: readonly TreeKeyValue[]) => {
    setExpandedKeysState(normalizeKeys(keys))
  }, [])
  const setSelectedKeys = useCallback((keys: readonly TreeKeyValue[]) => {
    setSelectedKeysState(normalizeKeys(keys))
  }, [])
  const toggleExpanded = useCallback((key: TreeKeyValue) => {
    setExpandedKeysState((prev) => {
      const normalizedKey = String(key)
      return prev.includes(normalizedKey)
        ? prev.filter((item) => item !== normalizedKey)
        : [...prev, normalizedKey]
    })
  }, [])
  const reset = useCallback(() => {
    setExpandedKeysState([])
    setSelectedKeysState([])
  }, [])

  return {
    expandedKeys,
    selectedKeys,
    setExpandedKeys,
    setSelectedKeys,
    toggleExpanded,
    reset,
  }
}
