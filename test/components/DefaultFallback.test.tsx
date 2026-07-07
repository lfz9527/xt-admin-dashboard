import { fireEvent, render, screen } from '@testing-library/react'
import DefaultFallback from '@/components/ErrorBoundary/DefaultFallback'

describe('DefaultFallback', () => {
  it('should render error message', () => {
    render(
      <DefaultFallback
        error={new Error('test error')}
        errorInfo={null}
        reset={() => {}}
      />
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('test error')).toBeInTheDocument()
  })

  it('should call reset on button click', () => {
    const reset = vi.fn()
    render(
      <DefaultFallback
        error={new Error('err')}
        errorInfo={null}
        reset={reset}
      />
    )
    fireEvent.click(screen.getByText('Try again'))
    expect(reset).toHaveBeenCalled()
  })
})
