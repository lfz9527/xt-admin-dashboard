import { render, screen } from '@testing-library/react'
import Access from '@/components/Access'

describe('Access', () => {
  it('should render children when disable is false', () => {
    render(
      <Access disable={false}>
        <span>content</span>
      </Access>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('should render fallback when disable is true', () => {
    render(
      <Access
        disable
        fallback={<span>fallback</span>}
      >
        <span>content</span>
      </Access>
    )
    expect(screen.getByText('fallback')).toBeInTheDocument()
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })

  it('should render children by default', () => {
    render(
      <Access>
        <span>default</span>
      </Access>
    )
    expect(screen.getByText('default')).toBeInTheDocument()
  })

  it('should render nothing when disable and no fallback', () => {
    const { container } = render(
      <Access disable>
        <span>hidden</span>
      </Access>
    )
    expect(container.textContent).toBe('')
  })
})
