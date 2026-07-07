import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

function ThrowError({
  message = 'test error',
}: {
  message?: string
}): React.ReactNode {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('normal content')).toBeInTheDocument()
  })

  it('should render custom fallback on error', () => {
    render(
      <ErrorBoundary
        fallback={({ error }) => <div>Caught: {error.message}</div>}
      >
        <ThrowError message='boom' />
      </ErrorBoundary>
    )
    expect(screen.getByText('Caught: boom')).toBeInTheDocument()
  })

  it('should render DefaultFallback when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('test error')).toBeInTheDocument()
  })

  it('should call onError callback', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError message='callback err' />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'callback err' }),
      expect.any(Object)
    )
  })

  it('should reset when resetKeys change', () => {
    let key = 1
    const { rerender } = render(
      <ErrorBoundary resetKeys={[key]}>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    key = 2
    rerender(
      <ErrorBoundary resetKeys={[key]}>
        <div>recovered</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('should not reset when resetKeys unchanged', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={[1]}>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    rerender(
      <ErrorBoundary resetKeys={[1]}>
        <div>should not render</div>
      </ErrorBoundary>
    )
    expect(screen.queryByText('should not render')).not.toBeInTheDocument()
  })
})
