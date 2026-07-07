import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalCrash from '@/components/ErrorBoundary/GlobalCrash'
import App from './app'
import '@/styles/index.css'
import '@/styles/tailwind.css'

const root = createRoot(document.getElementById('root')!, {
  // 捕获 ErrorBoundary 内部的错误
  onCaughtError: (error, errorInfo) => {
    console.group('[onCaughtError]')
    console.error('error:', error)
    console.error('componentStack:', errorInfo.componentStack)
    console.groupEnd()
  },
  // 捕获未捕获的错误（全局错误）
  onUncaughtError: (error, errorInfo) => {
    console.group('[onUncaughtError]')
    console.error('error:', error)
    console.error('componentStack:', errorInfo.componentStack)
    console.groupEnd()
  },
  // 捕获可恢复的错误（不会崩溃）
  onRecoverableError: (error) => {
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
