import { render, screen, fireEvent } from '@testing-library/react'
import GlobalCrash from '@/components/ErrorBoundary/GlobalCrash'

describe('GlobalCrash', () => {
  let reloadMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })
  })

  it('should render error message', () => {
    render(<GlobalCrash error={new Error('boom')} />)
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('should show refresh button when no reset provided', () => {
    render(<GlobalCrash error={new Error('err')} />)
    expect(screen.getByText('刷新页面')).toBeInTheDocument()
  })

  it('should show retry button when reset provided', () => {
    render(
      <GlobalCrash
        error={new Error('err')}
        reset={() => {}}
      />
    )
    expect(screen.getByText('重试')).toBeInTheDocument()
  })

  it('should call reset on retry click', () => {
    const reset = vi.fn()
    render(
      <GlobalCrash
        error={new Error('err')}
        reset={reset}
      />
    )
    fireEvent.click(screen.getByText('重试'))
    expect(reset).toHaveBeenCalled()
  })

  it('should reload page when no reset', () => {
    render(<GlobalCrash error={new Error('err')} />)
    fireEvent.click(screen.getByText('刷新页面'))
    expect(reloadMock).toHaveBeenCalled()
  })

  it('should toggle stack detail', () => {
    render(<GlobalCrash error={new Error('boom')} />)
    expect(screen.getByText('查看详情')).toBeInTheDocument()
    fireEvent.click(screen.getByText('查看详情'))
    expect(screen.getByText('收起详情')).toBeInTheDocument()
  })
})
