import { type ErrorInfo, type ReactNode } from 'react'

export type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export type ErrorBoundaryProps = {
  children: ReactNode
  /** 自定义 fallback UI，接收 error 与 reset 方法 */
  fallback?: (props: FallbackProps) => ReactNode
  /** 捕获到错误时回调，可用于上报日志 */
  onError?: (error: Error, info: ErrorInfo) => void
  /** 出错后重置的 key，变化时自动恢复 */
  resetKeys?: unknown[]
}

export interface FallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  reset: () => void
}
