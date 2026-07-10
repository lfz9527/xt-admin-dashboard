import { render, screen, act } from '@testing-library/react'
import AutoEllipsis from '@/components/AutoEllipsis'

describe('AutoEllipsis', () => {
  let resizeCallback: () => void

  beforeEach(() => {
    window.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = () => cb([], {} as ResizeObserver)
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    } as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render text content', () => {
    render(<AutoEllipsis text='hello' />)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('should set title when text overflows (single line)', () => {
    render(<AutoEllipsis text='long text' />)
    const el = screen.getByText('long text')
    vi.spyOn(el, 'scrollWidth', 'get').mockReturnValue(200)
    vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(100)
    act(() => resizeCallback())
    expect(el.getAttribute('title')).toBe('long text')
  })

  it('should not set title when text fits (single line)', () => {
    render(<AutoEllipsis text='short' />)
    const el = screen.getByText('short')
    vi.spyOn(el, 'scrollWidth', 'get').mockReturnValue(50)
    vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(100)
    act(() => resizeCallback())
    expect(el.getAttribute('title')).toBe('')
  })

  it('should set title when text overflows (multiline)', () => {
    render(
      <AutoEllipsis
        text='long text'
        lines={3}
      />
    )
    const el = screen.getByText('long text')
    vi.spyOn(el, 'scrollHeight', 'get').mockReturnValue(200)
    vi.spyOn(el, 'clientHeight', 'get').mockReturnValue(100)
    act(() => resizeCallback())
    expect(el.getAttribute('title')).toBe('long text')
  })

  it('should render numeric text', () => {
    render(<AutoEllipsis text={123} />)
    expect(screen.getByText('123')).toBeInTheDocument()
  })
})
