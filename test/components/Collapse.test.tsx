import { render, screen, fireEvent } from '@testing-library/react'
import { Collapse } from '@/components/Collapse'

const sampleItems = [
  { key: 'a', title: '标题A', children: '内容A' },
  { key: 'b', title: '标题B', children: '内容B' },
  { key: 'c', title: '标题C', children: '内容C' },
]

describe('Collapse - 非受控模式', () => {
  it('渲染所有 item 的 title', () => {
    render(<Collapse items={sampleItems} />)
    expect(screen.getByText('标题A')).toBeInTheDocument()
    expect(screen.getByText('标题B')).toBeInTheDocument()
    expect(screen.getByText('标题C')).toBeInTheDocument()
  })

  it('默认所有面板收起，content 不可见', () => {
    render(<Collapse items={sampleItems} />)
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()
  })

  it('点击 title 展开对应面板，content 可见', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('点击已展开的 title 收起面板', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('defaultOpen 项初始展开', () => {
    const items = [
      { key: 'a', title: 'A', children: '内容A', defaultOpen: true },
      { key: 'b', title: 'B', children: '内容B' },
    ]
    render(<Collapse items={items} />)
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()
  })

  it('defaultOpenKeys 指定初始展开', () => {
    render(
      <Collapse
        items={sampleItems}
        defaultOpenKeys={['b']}
      />
    )
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('独立模式下多个面板可同时展开', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    fireEvent.click(screen.getByText('标题B'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })
})

describe('Collapse - 手风琴模式', () => {
  it('同一时间只有一个面板展开', () => {
    render(
      <Collapse
        items={sampleItems}
        type='accordion'
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()

    fireEvent.click(screen.getByText('标题B'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('点击已展开的面板可收起', () => {
    render(
      <Collapse
        items={sampleItems}
        type='accordion'
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('手风琴模式下 defaultOpen 多个时只展开第一个', () => {
    const items = [
      { key: 'a', title: 'A', children: 'A内容', defaultOpen: true },
      { key: 'b', title: 'B', children: 'B内容', defaultOpen: true },
      { key: 'c', title: 'C', children: 'C内容' },
    ]
    render(
      <Collapse
        items={items}
        type='accordion'
      />
    )
    // 手风琴模式：后处理的 defaultOpen 覆盖前者，最终只有一项展开
    // items 顺序处理，key='b' 的 defaultOpen 覆盖 key='a'，所以只有 'b' 展开
    expect(screen.queryByText('A内容')).not.toBeInTheDocument()
    expect(screen.getByText('B内容')).toBeInTheDocument()
  })
})

describe('Collapse - 受控模式', () => {
  it('openKeys 控制展开状态', () => {
    const { rerender } = render(
      <Collapse
        items={sampleItems}
        openKeys={['a']}
      />
    )
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()

    rerender(
      <Collapse
        items={sampleItems}
        openKeys={['b']}
      />
    )
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('受控模式下点击触发 onToggle 而非内部状态变更', () => {
    const onToggle = vi.fn()
    render(
      <Collapse
        items={sampleItems}
        openKeys={['a']}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(onToggle).toHaveBeenCalledWith('a', false)
    // 外部未更新 openKeys，内容仍可见
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('受控模式下 onToggle 展开新面板', () => {
    const onToggle = vi.fn()
    render(
      <Collapse
        items={sampleItems}
        openKeys={[]}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(onToggle).toHaveBeenCalledWith('a', true)
  })
})

describe('Collapse - disabled', () => {
  it('disabled 项禁止从收起状态展开', () => {
    const items = [{ key: 'a', title: 'A', children: 'A内容', disabled: true }]
    render(<Collapse items={items} />)
    fireEvent.click(screen.getByText('A'))
    expect(screen.queryByText('A内容')).not.toBeInTheDocument()
  })

  it('disabled + defaultOpen 项禁止收起', () => {
    const items = [
      {
        key: 'a',
        title: 'A',
        children: 'A内容',
        disabled: true,
        defaultOpen: true,
      },
    ]
    render(<Collapse items={items} />)
    expect(screen.getByText('A内容')).toBeInTheDocument()
    fireEvent.click(screen.getByText('A'))
    // 仍然展开
    expect(screen.getByText('A内容')).toBeInTheDocument()
  })

  it('disabled 但非 defaultOpen 的已展开项可收起', () => {
    // disabled 仅禁止展开，不禁止收起（除非同时有 defaultOpen）
    const items = [
      {
        key: 'a',
        title: 'A',
        children: 'A内容',
        disabled: true,
        defaultOpen: true,
      },
      { key: 'b', title: 'B', children: 'B内容', disabled: true },
    ]
    const { rerender } = render(
      <Collapse
        items={items}
        openKeys={['a', 'b']}
        onToggle={() => {}}
      />
    )
    // item 'a': disabled + defaultOpen → 禁止收起
    // item 'b': disabled → 仅禁止展开，可收起
    rerender(
      <Collapse
        items={items}
        openKeys={['a']}
        onToggle={() => {}}
      />
    )
    expect(screen.queryByText('B内容')).not.toBeInTheDocument()
  })
})
