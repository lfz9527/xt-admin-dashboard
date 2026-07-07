import { render, screen } from '@testing-library/react'
import Loading from '@/components/Loading'

describe('Loading', () => {
  it('should render an accessible loading indicator', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
