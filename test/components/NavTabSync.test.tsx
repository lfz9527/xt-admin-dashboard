import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAuthor from '@/store/useAuthor'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

beforeEach(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => []
  }
  useAuthor.setState({ token: 'test-token' })
})

import { act, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { SidebarProvider } from '@/ui/Sidebar'
import { ProgressProvider } from '@bprogress/react'
import routes from '@/router/routes'
import { buildRouter } from '@/router/utils'
import { NavTab, NavTabProvider, NavTabSync } from '@/layout/NavTab'

function renderApp(initialEntry: string) {
  const router = createMemoryRouter(buildRouter(routes), {
    initialEntries: [initialEntry],
  })
  render(
    <SidebarProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </SidebarProvider>
  )
  return router
}

function tabItem(id: string): HTMLElement | null {
  return document.querySelector(`[data-tab-id="${id}"]`)
}

describe('NavTabSync', () => {
  it('路由变化时自动添加并激活对应标签', async () => {
    const router = renderApp('/')

    await waitFor(() => {
      expect(tabItem('/')?.textContent).toContain('首页')
    })
    expect(tabItem('/')?.getAttribute('data-active')).toBe('true')

    await act(async () => {
      await router.navigate('/dashboard/overview')
    })

    await waitFor(() => {
      expect(tabItem('/dashboard/overview')?.textContent).toContain('概览')
    })
    expect(tabItem('/dashboard/overview')?.getAttribute('data-active')).toBe(
      'true'
    )
    expect(tabItem('/')?.getAttribute('data-active')).toBe('false')
  })

  it('title 未配置时标签标题使用最后一个动态参数值', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <NavTabProvider>
              <NavTabSync />
              <NavTab />
            </NavTabProvider>
          ),
          children: [
            { path: 'users/:id', element: <div>user</div> },
            {
              path: 'posts/:id/edit/:step',
              element: <div>post</div>,
            },
          ],
        },
      ],
      { initialEntries: ['/users/196114'] }
    )
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const tab = document.querySelector('[data-tab-id="/users/196114"]')
      expect(tab?.textContent?.trim()).toBe('196114')
    })

    await act(async () => {
      await router.navigate('/posts/88/edit/2')
    })

    await waitFor(() => {
      const tab = document.querySelector('[data-tab-id="/posts/88/edit/2"]')
      expect(tab?.textContent?.trim()).toBe('2')
    })
  })

  it('点击标签切换到对应标签激活', async () => {
    const router = renderApp('/')

    await waitFor(() => {
      expect(tabItem('/')).not.toBeNull()
    })
    await act(async () => {
      await router.navigate('/dashboard/analytics')
    })
    await waitFor(() => {
      expect(tabItem('/dashboard/analytics')?.textContent).toContain('分析')
    })

    const homeTab = tabItem('/')
    expect(homeTab).not.toBeNull()
    act(() => {
      homeTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(tabItem('/')?.getAttribute('data-active')).toBe('true')
    })
    expect(router.state.location.pathname).toBe('/')
  })
})
