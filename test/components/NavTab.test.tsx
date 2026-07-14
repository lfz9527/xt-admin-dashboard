import { render, screen, fireEvent } from '@testing-library/react'
import {
  NavTabProvider,
  useNavTab,
  NavTab,
  type Tab,
} from '@/layout/NavTab'

describe('NavTabProvider + useNavTab', () => {
  it('不在 Provider 内使用时抛出错误', () => {
    function BadConsumer() {
      useNavTab()
      return null
    }
    expect(() => render(<BadConsumer />)).toThrow(
      'useNavTab must be used within a NavTabProvider.'
    )
  })

  it('addTab 新增标签页', () => {
    function Adder() {
      const { addTab, tabs, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => addTab({ id: '1', title: 'Tab 1' })}>
            Add
          </button>
          <span data-testid='active'>{activeTabId}</span>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider>
        <Adder />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('active').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('addTab 相同 id 不重复添加，只激活', () => {
    function Adder() {
      const { addTab, tabs } = useNavTab()
      return (
        <div>
          <button onClick={() => addTab({ id: '1', title: 'Tab 1' })}>
            Add
          </button>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider>
        <Adder />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Add'))
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('removeTab 关闭标签页', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    function Remover() {
      const { removeTab, tabs, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => removeTab('2')}>Remove</button>
          <span data-testid='active'>{activeTabId}</span>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='2'
      >
        <Remover />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Remove'))
    // 关闭的是当前激活的 tab，应激活前一个
    expect(screen.getByTestId('active').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('removeTab closable=false 不可关闭', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1', closable: false },
      { id: '2', title: 'Tab 2' },
    ]

    function Remover() {
      const { removeTab, tabs } = useNavTab()
      return (
        <div>
          <button onClick={() => removeTab('1')}>Remove</button>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Remover />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Remove'))
    expect(screen.getByTestId('count').textContent).toBe('2')
  })

  it('setActiveTab 切换标签页', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    function Switcher() {
      const { setActiveTab, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => setActiveTab('2')}>Switch</button>
          <span data-testid='active'>{activeTabId}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Switcher />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Switch'))
    expect(screen.getByTestId('active').textContent).toBe('2')
  })
})

describe('NavTab', () => {
  it('tabs 为空时不渲染任何内容', () => {
    const { container } = render(
      <NavTabProvider>
        <NavTab />
      </NavTabProvider>
    )
    expect(container.querySelector('[data-slot="nav-tab"]')).toBeNull()
  })

  it('渲染标签页标题', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <NavTab />
      </NavTabProvider>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('点击标签页切换激活', () => {
    // 使用 consumer 验证 activeTabId 变化
    function Page() {
      const { activeTabId } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='active'>{activeTabId}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Page />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Tab 2'))
    expect(screen.getByTestId('active').textContent).toBe('2')
  })

  it('关闭按钮点击触发 removeTab', () => {
    function Page() {
      const { tabs } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Page />
      </NavTabProvider>
    )

    // 第一个 tab 的关闭按钮 (X icon)
    const tab1Close = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')!
      .querySelector('[data-slot="nav-tab-close"]')!

    fireEvent.click(tab1Close)
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('closable=false 不显示关闭按钮', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Home', closable: false },
      { id: '2', title: 'Page' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <NavTab />
      </NavTabProvider>
    )

    const items = document.querySelectorAll('[data-slot="nav-tab-item"]')
    const homeItem = items[0]
    const pageItem = items[1]

    expect(homeItem.querySelector('[data-slot="nav-tab-close"]')).toBeNull()
    expect(pageItem.querySelector('[data-slot="nav-tab-close"]')).not.toBeNull()
  })
})
