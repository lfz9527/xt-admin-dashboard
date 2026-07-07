import { render, screen } from '@testing-library/react'
import RouteErrorBoundary from '@/components/ErrorBoundary/RouteErrorBoundary'

function ThrowError({
  message = 'test error',
}: {
  message?: string
}): React.ReactNode {
  throw new Error(message)
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children', () => {
    render(
      <RouteErrorBoundary>
        <div>route content</div>
      </RouteErrorBoundary>
    )
    expect(screen.getByText('route content')).toBeInTheDocument()
  })

  it('should catch errors and show fallback', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError message='route error' />
      </RouteErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('route error')).toBeInTheDocument()
  })
})
