import { render, screen, waitFor } from '@testing-library/react'
import LazyImport, { Lazy } from '@/components/LazyImport'

describe('LazyImport', () => {
  it('should render children directly', () => {
    render(
      <LazyImport>
        <div>lazy content</div>
      </LazyImport>
    )
    expect(screen.getByText('lazy content')).toBeInTheDocument()
  })

  it('should render with custom fallback', () => {
    render(
      <LazyImport fallback={<div>custom loading</div>}>
        <span>done</span>
      </LazyImport>
    )
    expect(screen.getByText('done')).toBeInTheDocument()
  })
})

describe('Lazy', () => {
  it('should render lazy component', async () => {
    function TestComp() {
      return <div>lazy loaded</div>
    }
    const el = Lazy(() => Promise.resolve({ default: TestComp }))
    render(el)
    await waitFor(() => {
      expect(screen.getByText('lazy loaded')).toBeInTheDocument()
    })
  })
})
