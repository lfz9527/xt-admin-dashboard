import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  FallbackProps,
} from './types'
import DefaultFallback from './DefaultFallback'
import { Component, type ErrorInfo } from 'react'

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info })
    this.props.onError?.(error, info)
  }

  /** resetKeys 变化时自动恢复正常状态 */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    if (this.state.hasError && resetKeys) {
      const changed = resetKeys.some(
        (key, i) => key !== prevProps.resetKeys?.[i]
      )
      if (changed) this.handleReset()
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      const props: FallbackProps = { error, errorInfo, reset: this.handleReset }
      return fallback ? fallback(props) : <DefaultFallback {...props} />
    }
    return children
  }
}

export default ErrorBoundary
