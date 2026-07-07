// import { useLocation } from 'react-router-dom'

import ErrorBoundary from './index'

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  // const location = useLocation()

  const onReport = (err: Error) => {
    console.log('路由错误', err)
  }

  return (
    <ErrorBoundary
      resetKeys={[window.location.pathname]}
      onError={(err) => onReport(err)}
    >
      {children}
    </ErrorBoundary>
  )
}
export default RouteErrorBoundary
