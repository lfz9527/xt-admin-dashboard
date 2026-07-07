import { useState, useCallback } from 'react'

/**
 * 在函数组件内主动抛出错误，
 * 使其被最近的 ErrorBoundary 捕获。
 */
export function useErrorBoundary() {
  const [, setState] = useState({})

  const throwError = useCallback((error: unknown) => {
    setState(() => {
      throw error
    })
  }, [])

  return { throwError }
}
