import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalCrash from '@/components/ErrorBoundary/GlobalCrash'
import { IS_PROD } from '@/constants'
import { authLogout, getAuthToken } from '@/features/auth/session'
import { configureAuthHandlers } from '@/service/request'
import App from './app'
import '@/styles/tailwind.css'

configureAuthHandlers({
  getToken: getAuthToken,
  onUnauthorized: authLogout,
})

// 移动端调试控制台是否启用仅由 .env 的 VITE_USE_ERUDA 控制
if (import.meta.env.VITE_USE_ERUDA) {
  import('eruda').then(({ default: eruda }) => {
    eruda.init()
  })
}

const root = createRoot(document.getElementById('root')!, {
  // 错误详情（含堆栈与组件树）仅在开发环境输出控制台；生产环境不打印，
  // 避免向打开 devtools 的用户泄露内部实现，将来接入日志上报时单独收口
  // 捕获 ErrorBoundary 内部的错误
  onCaughtError: (error, errorInfo) => {
    if (IS_PROD) return
    console.group('[onCaughtError]')
    console.error('error:', error)
    console.error('componentStack:', errorInfo.componentStack)
    console.groupEnd()
  },
  // 捕获未捕获的错误（全局错误）
  onUncaughtError: (error, errorInfo) => {
    if (IS_PROD) return
    console.group('[onUncaughtError]')
    console.error('error:', error)
    console.error('componentStack:', errorInfo.componentStack)
    console.groupEnd()
  },
  // 捕获可恢复的错误（不会崩溃）
  onRecoverableError: (error) => {
    if (IS_PROD) return
    console.warn('recoverable error', error)
  },
  // 用于生成唯一 ID 前缀
  identifierPrefix: 'xt',
})

root.render(
  <StrictMode>
    {/* 负责渲染层的错误 → 展示 fallback，用户可点击重试 */}
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <GlobalCrash
          error={error}
          reset={reset}
        />
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
)
