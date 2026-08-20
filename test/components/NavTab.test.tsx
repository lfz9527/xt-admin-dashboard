import { act, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router'
import { NavTabProvider, useNavTab, NavTab, type Tab } from '@/layout/NavTab'

let resizeObserverCallbacks: ResizeObserverCallback[] = []
const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
  resizeObserverCallbacks = []
  window.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      resizeObserverCallbacks.push(callback)
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
})

function triggerResizeObservers() {
  act(() => {
    resizeObserverCallbacks.forEach((callback) =>
      callback([], {} as ResizeObserver)
    )
  })
}

function setViewportMetrics(
  viewport: Element,
  metrics: Partial<{
    clientWidth: number
    scrollWidth: number
    scrollLeft: number
  }>
) {
  Object.entries(metrics).forEach(([property, value]) => {
    Object.defineProperty(viewport, property, {
      configurable: true,
      value,
      writable: true,
    })
  })
}

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
      <MemoryRouter>
        <NavTabProvider>
          <Adder />
        </NavTabProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <NavTabProvider>
          <Adder />
        </NavTabProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='2'
        >
          <Remover />
        </NavTabProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <Remover />
        </NavTabProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <Switcher />
        </NavTabProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Switch'))
    expect(screen.getByTestId('active').textContent).toBe('2')
  })
})

describe('NavTab', () => {
  it('tabs 为空时不渲染任何内容', () => {
    const { container } = render(
      <MemoryRouter>
        <NavTabProvider>
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )
    expect(container.querySelector('[data-slot="nav-tab"]')).toBeNull()
  })

  it('渲染标签页标题', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('使用 ScrollArea 提供横向滚动区域', () => {
    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={[
            { id: '1', title: 'Tab 1' },
            { id: '2', title: 'Tab 2' },
          ]}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const scrollArea = document.querySelector('[data-slot="scroll-area"]')
    expect(scrollArea).toBeInTheDocument()
    expect(scrollArea).toHaveClass('min-w-0', 'flex-1')
    expect(scrollArea?.parentElement).toHaveClass('flex')
    const viewport = document.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    expect(viewport).toBeInTheDocument()
    expect(viewport).toContainElement(
      document.querySelector('[data-slot="nav-tab-item"]')
    )
  })

  it('无溢出时不渲染滚动按钮', () => {
    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={[{ id: '1', title: 'Tab 1' }]}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const viewport = document.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )!
    setViewportMetrics(viewport, { clientWidth: 120, scrollWidth: 120 })
    triggerResizeObservers()

    expect(
      screen.queryByRole('button', { name: '向左滚动' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '向右滚动' })
    ).not.toBeInTheDocument()
  })

  it('有溢出时显示滚动按钮并按边界禁用', () => {
    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={[
            { id: '1', title: 'Tab 1' },
            { id: '2', title: 'Tab 2' },
          ]}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const viewport = document.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )!
    setViewportMetrics(viewport, {
      clientWidth: 120,
      scrollWidth: 240,
      scrollLeft: 0,
    })
    triggerResizeObservers()

    expect(screen.getByRole('button', { name: '向左滚动' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '向右滚动' })).toBeEnabled()
  })

  it('点击滚动按钮按平滑方向滚动 viewport', () => {
    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={[
            { id: '1', title: 'Tab 1' },
            { id: '2', title: 'Tab 2' },
          ]}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const viewport = document.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement & {
      scrollBy: (options: ScrollToOptions) => void
    }
    setViewportMetrics(viewport, {
      clientWidth: 120,
      scrollWidth: 240,
      scrollLeft: 0,
    })
    const scrollBy = vi.fn()
    viewport.scrollBy = scrollBy
    triggerResizeObservers()

    fireEvent.click(screen.getByRole('button', { name: '向右滚动' }))
    expect(scrollBy).toHaveBeenCalledWith({ left: 120, behavior: 'smooth' })

    setViewportMetrics(viewport, { scrollLeft: 120 })
    viewport.dispatchEvent(new Event('scroll'))
    triggerResizeObservers()

    fireEvent.click(screen.getByRole('button', { name: '向左滚动' }))
    expect(scrollBy).toHaveBeenCalledWith({ left: -120, behavior: 'smooth' })
  })
  it('激活 Tab 变化后自动滚动到可见区域', () => {
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'scrollIntoView'
    )
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    function Activator() {
      const { setActiveTab } = useNavTab()
      return (
        <>
          <button onClick={() => setActiveTab('2')}>Activate 2</button>
          <NavTab />
        </>
      )
    }

    try {
      render(
        <MemoryRouter>
          <NavTabProvider
            defaultTabs={[
              { id: '1', title: 'Tab 1' },
              { id: '2', title: 'Tab 2' },
            ]}
            defaultActiveTabId='1'
          >
            <Activator />
          </NavTabProvider>
        </MemoryRouter>
      )

      const tab2 = screen
        .getByText('Tab 2')
        .closest('[data-slot="nav-tab-item"]') as HTMLElement
      const viewport = document.querySelector(
        '[data-slot="scroll-area-viewport"]'
      )!
      expect(viewport).toContainElement(tab2)
      scrollIntoView.mockClear()

      fireEvent.click(screen.getByText('Activate 2'))

      const callIndex = scrollIntoView.mock.contexts.findIndex(
        (context) => context === tab2
      )
      expect(callIndex).toBeGreaterThanOrEqual(0)
      expect(scrollIntoView.mock.calls[callIndex]).toEqual([
        { inline: 'nearest', block: 'nearest' },
      ])
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(
          Element.prototype,
          'scrollIntoView',
          originalScrollIntoView
        )
      } else {
        Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
      }
    }
  })

  it('通过 addTab 新增并激活 Tab 后自动滚动', () => {
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'scrollIntoView'
    )
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    function Adder() {
      const { addTab } = useNavTab()
      return (
        <>
          <button onClick={() => addTab({ id: 'new', title: 'New Tab' })}>
            Add
          </button>
          <NavTab />
        </>
      )
    }

    try {
      render(
        <MemoryRouter>
          <NavTabProvider>
            <Adder />
          </NavTabProvider>
        </MemoryRouter>
      )
      scrollIntoView.mockClear()

      fireEvent.click(screen.getByText('Add'))

      const newTab = screen
        .getByText('New Tab')
        .closest('[data-slot="nav-tab-item"]') as HTMLElement
      const callIndex = scrollIntoView.mock.contexts.findIndex(
        (context) => context === newTab
      )
      expect(callIndex).toBeGreaterThanOrEqual(0)
      expect(scrollIntoView.mock.calls[callIndex]).toEqual([
        { inline: 'nearest', block: 'nearest' },
      ])
      expect(newTab).toHaveAttribute('data-active', 'true')
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(
          Element.prototype,
          'scrollIntoView',
          originalScrollIntoView
        )
      } else {
        Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
      }
    }
  })

  it('点击标签页跳转对应路由', () => {
    function Page() {
      const { pathname } = useLocation()
      return (
        <div>
          <NavTab />
          <span data-testid='pathname'>{pathname}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '/', title: 'Tab 1' },
      { id: '/two', title: 'Tab 2' },
    ]

    render(
      <MemoryRouter initialEntries={['/']}>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='/'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Tab 2'))
    expect(screen.getByTestId('pathname').textContent).toBe('/two')
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
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    // 第一个 tab 的关闭按钮 (X icon)
    const tab1Close = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')!
      .querySelector('[data-slot="nav-tab-close"]')!

    fireEvent.click(tab1Close)
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('关闭激活标签后跳转第一个标签路由', () => {
    function Page() {
      const { pathname } = useLocation()
      const { tabs } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='pathname'>{pathname}</span>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '/', title: 'Tab 1' },
      { id: '/two', title: 'Tab 2' },
      { id: '/three', title: 'Tab 3' },
    ]

    render(
      <MemoryRouter initialEntries={['/three']}>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='/three'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab3Close = screen
      .getByText('Tab 3')
      .closest('[data-slot="nav-tab-item"]')!
      .querySelector('[data-slot="nav-tab-close"]')!

    fireEvent.click(tab3Close)
    expect(screen.getByTestId('count').textContent).toBe('2')
    // 关闭激活标签后激活剩余第一个标签，而非前一个
    expect(screen.getByTestId('pathname').textContent).toBe('/')
  })

  it('closable=false 不显示关闭按钮', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Home', closable: false },
      { id: '2', title: 'Page' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const items = document.querySelectorAll('[data-slot="nav-tab-item"]')
    const homeItem = items[0]
    const pageItem = items[1]

    expect(homeItem.querySelector('[data-slot="nav-tab-close"]')).toBeNull()
    expect(pageItem.querySelector('[data-slot="nav-tab-close"]')).not.toBeNull()
  })

  it('右键标签弹出包含四个菜单项的菜单', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
      { id: '3', title: 'Tab 3' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='2'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab2 = screen
      .getByText('Tab 2')
      .closest('[data-slot="nav-tab-item"]')!

    fireEvent.contextMenu(tab2)

    expect(screen.getByRole('menuitem', { name: '关闭' })).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: '关闭左侧标签页' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: '关闭全部标签页' })
    ).toBeInTheDocument()
  })

  it('右键菜单关闭当前标签', () => {
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
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab2 = screen
      .getByText('Tab 2')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab2)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭' }))

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.queryByText('Tab 2')).not.toBeInTheDocument()
  })

  it('右键菜单关闭左侧标签页', () => {
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
      { id: '3', title: 'Tab 3' },
      { id: '4', title: 'Tab 4' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='3'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab3 = screen
      .getByText('Tab 3')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab3)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭左侧标签页' }))

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.queryByText('Tab 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Tab 2')).not.toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
    expect(screen.getByText('Tab 4')).toBeInTheDocument()
  })

  it('右键菜单关闭右侧标签页', () => {
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
      { id: '3', title: 'Tab 3' },
      { id: '4', title: 'Tab 4' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab2 = screen
      .getByText('Tab 2')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab2)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭右侧标签页' }))

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.queryByText('Tab 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Tab 4')).not.toBeInTheDocument()
  })

  it('右键菜单关闭全部标签页仅保留当前激活', () => {
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
      { id: '3', title: 'Tab 3' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='2'
        >
          <Page />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab1 = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab1)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.queryByText('Tab 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Tab 3')).not.toBeInTheDocument()
  })

  it('只有一个标签时右键菜单的关闭项禁用', () => {
    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={[{ id: '1', title: 'Tab 1' }]}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab1 = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab1)

    expect(screen.getByRole('menuitem', { name: '关闭' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(
      screen.getByRole('menuitem', { name: '关闭全部标签页' })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('第一个标签的右键菜单关闭左侧禁用，最后一个关闭右侧禁用', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
      { id: '3', title: 'Tab 3' },
    ]

    render(
      <MemoryRouter>
        <NavTabProvider
          defaultTabs={defaultTabs}
          defaultActiveTabId='1'
        >
          <NavTab />
        </NavTabProvider>
      </MemoryRouter>
    )

    const tab1 = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab1)
    expect(
      screen.getByRole('menuitem', { name: '关闭左侧标签页' })
    ).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).not.toHaveAttribute('aria-disabled')

    const tab3 = screen
      .getByText('Tab 3')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tab3)
    expect(
      screen.getByRole('menuitem', { name: '关闭左侧标签页' })
    ).not.toHaveAttribute('aria-disabled')
    expect(
      screen.getByRole('menuitem', { name: '关闭右侧标签页' })
    ).toHaveAttribute('aria-disabled', 'true')
  })
})
