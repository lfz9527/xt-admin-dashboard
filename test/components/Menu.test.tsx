import { describe, expect, it, vi, beforeEach } from 'vitest'
import { House, Settings2 } from 'lucide-react'
import { render, screen, act } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { SidebarProvider } from '@/ui/Sidebar'
import { ProgressProvider } from '@bprogress/react'
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

import routes from '@/router/routes'
import { routeToMenus, allowAllPermissions } from '@/router/menu'
import { buildRouter } from '@/router/utils'
import useMenu from '@/store/useMenu'

describe('Menus', () => {
  it('derives home and system menu hierarchy from routes', () => {
    const menus = routeToMenus(routes)

    const keys = menus.flatMap((item) => [
      item.key,
      ...(item.children?.flatMap((child) => [
        child.key,
        ...(child.children?.map(({ key }) => key) ?? []),
      ]) ?? []),
    ])

    expect(keys).toEqual(['home', 'system', 'system-users', 'system-roles'])
    expect(menus[0]).toMatchObject({ key: 'home', icon: House })
    expect(menus[1]).toMatchObject({ key: 'system', icon: Settings2 })
    expect(
      menus
        .flatMap((item) => item.children ?? [])
        .some(({ key }) => key.includes('detail'))
    ).toBe(false)
  })

  it('renders complete detail breadcrumbs from real routes and derived menus', async () => {
    const router = createMemoryRouter(
      buildRouter(routes, allowAllPermissions),
      {
        initialEntries: ['/system/users/123'],
      }
    )

    render(
      <SidebarProvider>
        <ProgressProvider>
          <RouterProvider router={router} />
        </ProgressProvider>
      </SidebarProvider>
    )

    expect((await screen.findAllByText('用户管理')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('123')).length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByRole('link', { name: '用户管理' })
        .find((link) => link.getAttribute('aria-current') === 'page')
    ).toHaveAttribute('href', '/system/users')

    await act(async () => {
      await router.navigate('/system/roles')
    })

    expect((await screen.findAllByText('角色管理')).length).toBeGreaterThan(0)
    expect(screen.queryByText('detail')).not.toBeInTheDocument()
    // 菜单链接指向角色管理列表页
    expect(
      screen
        .getAllByRole('link', { name: '角色管理' })
        .find((link) => link.getAttribute('href') === '/system/roles')
    ).toBeDefined()
    // 面包屑当前页为 BreadcrumbPage（role=link + aria-current=page，无 href）
    expect(
      screen
        .getAllByRole('link', { name: '角色管理' })
        .find((link) => link.getAttribute('aria-current') === 'page')
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('叶子菜单在自身路由激活时点亮', async () => {
    const router = createMemoryRouter(buildRouter(routes), {
      initialEntries: ['/system/users'],
    })

    render(
      <SidebarProvider>
        <ProgressProvider>
          <RouterProvider router={router} />
        </ProgressProvider>
      </SidebarProvider>
    )

    const usersLink = (await screen.findAllByRole('link', { name: '用户管理' }))
      .map((link) => link as HTMLElement)
      .find((link) => link.getAttribute('data-active') === 'true')
    expect(usersLink).toBeDefined()
    expect(usersLink).toHaveAttribute('href', '/system/users')
  })

  it('keeps only sidebar state in the menu store', () => {
    const state = useMenu.getState()

    expect(state).not.toHaveProperty('menus')
    expect(localStorage.getItem('app-menu')).toBeNull()
  })
})
