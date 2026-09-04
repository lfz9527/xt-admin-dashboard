import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { NavTabProvider, NavTabSync, type Tab } from '@/layout/NavTab'
import Main from '@/layout/main'
import useMenu from '@/store/useMenu'

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid='app-header'>header</div>,
}))

const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
  useMenu.setState({ maximized: false })
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
})

/** 统计页面组件挂载次数，验证「刷新」是否触发内容重挂载 */
function makePage() {
  let mounts = 0
  function Page() {
    mounts++
    return <span data-testid='mounts'>{mounts}</span>
  }
  return { Page, getMounts: () => mounts }
}

function LocationDisplay() {
  const { pathname } = useLocation()
  return <span data-testid='pathname'>{pathname}</span>
}

async function renderHarness({
  defaultTabs,
  defaultActiveTabId,
  pageA,
  pageB,
  initialEntries = ['/'],
}: {
  defaultTabs: Tab[]
  defaultActiveTabId: string
  pageA: React.ReactNode
  pageB: React.ReactNode
  initialEntries?: string[]
}) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <NavTabProvider
            defaultTabs={defaultTabs}
            defaultActiveTabId={defaultActiveTabId}
          >
            <LocationDisplay />
            <NavTabSync />
            <Main />
          </NavTabProvider>
        ),
        children: [
          { index: true, element: pageA },
          { path: 'two', element: pageB },
        ],
      },
    ],
    { initialEntries }
  )
  render(<RouterProvider router={router} />)
  // Main 中 NavTab 为懒加载组件，等待标签栏挂载完成后再继续交互
  await waitFor(() => {
    expect(document.querySelector('[data-slot="nav-tab"]')).toBeTruthy()
  })
  return router
}

describe('NavTab 刷新（Main 内容重挂载）', () => {
  it('右键刷新激活标签时页面内容重新挂载', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(screen.getByTestId('mounts').textContent).toBe('1')

    const tabA = screen
      .getByText('Tab A')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabA)
    fireEvent.click(screen.getByRole('menuitem', { name: '刷新' }))

    expect(a.getMounts()).toBe(2)
    expect(screen.getByTestId('mounts').textContent).toBe('2')
    expect(b.getMounts()).toBe(0)
  })

  it('右键刷新非激活标签时先跳转到该标签并挂载页面', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(screen.getByTestId('pathname').textContent).toBe('/')

    const tabB = screen
      .getByText('Tab B')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabB)
    fireEvent.click(screen.getByRole('menuitem', { name: '刷新' }))

    expect(screen.getByTestId('pathname').textContent).toBe('/two')
    expect(b.getMounts()).toBe(1)
    expect(a.getMounts()).toBe(1)
  })

  it('点击功能区刷新按钮重新挂载当前页面', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(screen.getByTestId('mounts').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: '刷新' }))

    expect(a.getMounts()).toBe(2)
    expect(screen.getByTestId('mounts').textContent).toBe('2')
    expect(screen.getByTestId('pathname').textContent).toBe('/')
    expect(b.getMounts()).toBe(0)
  })

  it('仅切换标签不触发刷新时正常跳转', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    fireEvent.click(screen.getByText('Tab B'))
    expect(screen.getByTestId('pathname').textContent).toBe('/two')
    expect(b.getMounts()).toBe(1)
    expect(a.getMounts()).toBe(1)
  })

  it('点击功能区最大化按钮隐藏顶部 Header，还原后恢复', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(useMenu.getState().maximized).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '最大化' }))
    expect(useMenu.getState().maximized).toBe(true)
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument()
    // 最大化时内容区仍在（聚焦内容）
    expect(screen.getByTestId('mounts').textContent).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: '还原' }))
    expect(useMenu.getState().maximized).toBe(false)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
  })

  it('右键菜单项可最大化隐藏 Header，菜单文案随状态变为还原，点击后恢复', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(screen.getByTestId('app-header')).toBeInTheDocument()

    const tabA = screen
      .getByText('Tab A')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabA)
    fireEvent.click(screen.getByRole('menuitem', { name: '最大化' }))

    expect(useMenu.getState().maximized).toBe(true)
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument()
    expect(screen.getByTestId('mounts').textContent).toBe('1')

    // 再次右键同一标签，菜单项应显示「还原」并可恢复布局
    fireEvent.contextMenu(tabA)
    fireEvent.click(screen.getByRole('menuitem', { name: '还原' }))

    expect(useMenu.getState().maximized).toBe(false)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
  })

  it('无固定标签时关闭全部清空标签并默认打开第一个菜单（首页）', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A' },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/two',
      pageA: <a.Page />,
      pageB: <b.Page />,
      initialEntries: ['/two'],
    })

    expect(screen.getByTestId('pathname').textContent).toBe('/two')
    expect(b.getMounts()).toBe(1)

    const tabB = screen
      .getByText('Tab B')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabB)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    // 激活标签 Tab B 一并关闭；标签全部关闭后自动打开菜单第一个菜单（首页）
    expect(screen.getByTestId('pathname').textContent).toBe('/')
    expect(a.getMounts()).toBe(1)
    expect(screen.queryByText('Tab B')).not.toBeInTheDocument()
    expect(screen.getByText('首页')).toBeInTheDocument()
  })

  it('固定标签存活时关闭全部激活第一个固定标签并跳转', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A', pinned: true },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/two',
      pageA: <a.Page />,
      pageB: <b.Page />,
      initialEntries: ['/two'],
    })

    expect(b.getMounts()).toBe(1)

    const tabB = screen
      .getByText('Tab B')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabB)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    // 激活标签 Tab B 被关闭，激活转移到剩余的第一个（固定）标签 '/'
    expect(screen.getByTestId('pathname').textContent).toBe('/')
    expect(a.getMounts()).toBe(1)
    expect(screen.queryByText('Tab B')).not.toBeInTheDocument()
    expect(screen.getByText('Tab A')).toBeInTheDocument()
    expect(
      screen
        .getByText('Tab A')
        .closest('[data-slot="nav-tab-item"]')
        ?.getAttribute('data-active')
    ).toBe('true')
  })

  it('激活标签为固定标签时关闭全部保持其激活且不重复跳转', async () => {
    const a = makePage()
    const b = makePage()

    await renderHarness({
      defaultTabs: [
        { id: '/', title: 'Tab A', pinned: true },
        { id: '/two', title: 'Tab B' },
      ],
      defaultActiveTabId: '/',
      pageA: <a.Page />,
      pageB: <b.Page />,
    })

    expect(a.getMounts()).toBe(1)

    const tabA = screen
      .getByText('Tab A')
      .closest('[data-slot="nav-tab-item"]')!
    fireEvent.contextMenu(tabA)
    fireEvent.click(screen.getByRole('menuitem', { name: '关闭全部标签页' }))

    // 激活标签是固定标签未被关闭：保持激活，仅关闭其余标签
    expect(screen.getByTestId('pathname').textContent).toBe('/')
    expect(a.getMounts()).toBe(1)
    expect(screen.queryByText('Tab B')).not.toBeInTheDocument()
    expect(screen.getByText('Tab A')).toBeInTheDocument()
  })
})
