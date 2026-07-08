import { render, screen, fireEvent } from '@testing-library/react'
import { Collapse } from '@/components/Collapse'

describe('Collapse', () => {
  it('渲染 title', () => {
    render(<Collapse title='标题A'>内容A</Collapse>)
    expect(screen.getByText('标题A')).toBeInTheDocument()
  })

  it('默认收起，content 不可见', () => {
    render(<Collapse title='标题A'>内容A</Collapse>)
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('点击 title 展开，content 可见', () => {
    render(<Collapse title='标题A'>内容A</Collapse>)
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('点击已展开的 title 收起', () => {
    render(<Collapse title='标题A'>内容A</Collapse>)
    fireEvent.click(screen.getByText('标题A'))
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('defaultOpen 初始展开', () => {
    render(
      <Collapse
        title='标题A'
        defaultOpen
      >
        内容A
      </Collapse>
    )
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('open 受控模式 - 外部控制展开', () => {
    const { rerender } = render(
      <Collapse
        title='标题A'
        open={false}
      >
        内容A
      </Collapse>
    )
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()

    rerender(
      <Collapse
        title='标题A'
        open
      >
        内容A
      </Collapse>
    )
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('受控模式下点击触发 onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(
      <Collapse
        title='标题A'
        open
        onOpenChange={onOpenChange}
      >
        内容A
      </Collapse>
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disabled 禁止展开', () => {
    render(
      <Collapse
        title='标题A'
        disabled
      >
        内容A
      </Collapse>
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('disabled + defaultOpen 禁止收起', () => {
    render(
      <Collapse
        title='标题A'
        disabled
        defaultOpen
      >
        内容A
      </Collapse>
    )
    expect(screen.getByText('内容A')).toBeInTheDocument()
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('trigger 自定义触发器，覆盖 title', () => {
    render(
      <Collapse
        title='标题A'
        trigger={<button>自定义按钮</button>}
      >
        内容A
      </Collapse>
    )
    expect(screen.getByText('自定义按钮')).toBeInTheDocument()
    expect(screen.queryByText('标题A')).not.toBeInTheDocument()
  })

  it('className 透传到 Collapsible 根元素', () => {
    render(
      <Collapse
        title='标题A'
        className='custom-class'
      >
        内容A
      </Collapse>
    )
    const el = document.querySelector('[data-slot="collapsible"]')
    expect(el?.className).toContain('custom-class')
  })
})
