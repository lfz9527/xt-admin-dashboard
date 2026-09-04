import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { NavTabProvider, NavTabSync, type Tab } from '@/layout/NavTab'
import Main from '@/layout/main'

vi.mock('@/components/Header', () => ({ default: () => null }))

const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
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

function renderHarness({
  defaultTabs,
  defaultActiveTabId,
  pageA,
  pageB,
}: {
  defaultTabs: Tab[]
  defaultActiveTabId: string
  pageA: React.ReactNode
  pageB: React.ReactNode
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
    { initialEntries: ['/'] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('NavTab 刷新（Main 内容重挂载）', () => {
  it('右键刷新激活标签时页面内容重新挂载', () => {
    const a = makePage()
    const b = makePage()

    renderHarness({
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

  it('右键刷新非激活标签时先跳转到该标签并挂载页面', () => {
    const a = makePage()
    const b = makePage()

    renderHarness({
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

  it('点击功能区刷新按钮重新挂载当前页面', () => {
    const a = makePage()
    const b = makePage()

    renderHarness({
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

  it('仅切换标签不触发刷新时正常跳转', () => {
    const a = makePage()
    const b = makePage()

    renderHarness({
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
})
