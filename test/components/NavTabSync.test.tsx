import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAuthor from '@/store/useAuthor'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

const userInfo = vi.hoisted(() => ({
  id: '1',
  nickname: 'admin',
  email: 'admin@example.com',
  avatar: '',
  gender: 0,
  status: 0,
  lastLoginTime: null,
  roleId: 1,
  role: { id: 1, name: '管理员', roleKey: 'admin' },
  createdAt: '2026-08-01T06:00:00.000Z',
  updatedAt: '2026-08-01T06:00:00.000Z',
}))

vi.mock('@/service/users', () => ({
  getUserInfo: vi.fn().mockResolvedValue({ data: userInfo }),
  getUsers: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  getUser: vi.fn().mockResolvedValue({ data: userInfo }),
  createUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  deleteUser: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
}))

vi.mock('@/service/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  getRole: vi.fn().mockResolvedValue({ data: null }),
  createRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  deleteRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
}))

beforeEach(() => {
  localStorage.clear()
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
  useAuthor.setState({ token: 'test-token', roleKey: 'admin' })
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
      await router.navigate('/system/users')
    })

    await waitFor(() => {
      expect(tabItem('/system/users')?.textContent).toContain('用户管理')
    })
    expect(tabItem('/system/users')?.getAttribute('data-active')).toBe('true')
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
      await router.navigate('/system/roles')
    })
    await waitFor(() => {
      expect(tabItem('/system/roles')?.textContent).toContain('角色管理')
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
