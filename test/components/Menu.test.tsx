import { describe, expect, it, vi, beforeEach } from 'vitest'
import { House, Globe, Settings2 } from 'lucide-react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { SidebarProvider, useSidebar } from '@/ui/Sidebar'
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
  updateProfile: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  uploadAvatar: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
}))

vi.mock('@/service/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  getRole: vi.fn().mockResolvedValue({ data: null }),
  createRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  updateRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  deleteRole: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
}))

// 全树渲染会经字典 store 拉取下拉选项；不 mock 会发出真实请求，
// 后端运行时返回 401 触发拦截器登出，测试环境不稳定
vi.mock('@/service/dict', () => ({
  getDictTypes: vi.fn().mockResolvedValue({
    data: { list: [], total: 0, totalPages: 0 },
  }),
  createDictType: vi.fn().mockResolvedValue({ data: null }),
  updateDictType: vi.fn().mockResolvedValue({ data: null }),
  updateDictTypeStatus: vi.fn().mockResolvedValue({ data: null }),
  deleteDictType: vi.fn().mockResolvedValue({ data: null }),
  getDictItems: vi.fn().mockResolvedValue({
    data: { list: [], total: 0, totalPages: 0 },
  }),
  createDictItem: vi.fn().mockResolvedValue({ data: null }),
  updateDictItem: vi.fn().mockResolvedValue({ data: null }),
  updateDictItemStatus: vi.fn().mockResolvedValue({ data: null }),
  deleteDictItem: vi.fn().mockResolvedValue({ data: null }),
  getEnabledDicts: vi.fn().mockResolvedValue({ data: [] }),
  getDictOptions: vi.fn().mockResolvedValue({ data: [] }),
  listAllDictTypes: vi.fn().mockResolvedValue({ data: [] }),
  listAllDictItems: vi.fn().mockResolvedValue({ data: [] }),
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
import { MenuItemLink } from '@/components/Menu/menus'

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

    expect(keys).toEqual([
      'home',
      'resume',
      'browser',
      'browser-bookmarks',
      'system',
      'system-users',
      'system-roles',
      'system-dict',
    ])
    expect(menus[0]).toMatchObject({ key: 'home', icon: House })
    expect(menus[1]).toMatchObject({ key: 'resume', openIn: 'newTab' })
    expect(menus[2]).toMatchObject({ key: 'browser', icon: Globe })
    expect(menus[3]).toMatchObject({ key: 'system', icon: Settings2 })
    expect(
      menus
        .flatMap((item) => item.children ?? [])
        .some(({ key }) => key.includes('detail'))
    ).toBe(false)
  })

  it('derives the resume menu with new-tab open mode from routes', () => {
    const menus = routeToMenus(routes)

    expect(menus.find((item) => item.key === 'resume')).toMatchObject({
      title: '我的简历',
      path: '/resume',
      openIn: 'newTab',
    })
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

  it('叶子菜单默认在当前标签页打开（不带 target）', () => {
    render(
      <SidebarProvider>
        <MemoryRouter>
          <MenuItemLink item={{ key: 'home', title: '首页', path: '/' }} />
        </MemoryRouter>
      </SidebarProvider>
    )

    const link = screen.getByRole('link', { name: '首页' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('openIn=newTab 时在新浏览器标签页打开（target=_blank + rel=noreferrer）', () => {
    render(
      <SidebarProvider>
        <MemoryRouter>
          <MenuItemLink
            item={{
              key: 'bookmarks',
              title: '书签管理',
              path: '/browser/bookmarks',
              openIn: 'newTab',
            }}
          />
        </MemoryRouter>
      </SidebarProvider>
    )

    const link = screen.getByRole('link', { name: '书签管理' })
    expect(link).toHaveAttribute('href', '/browser/bookmarks')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('移动端点击菜单链接后自动收起侧边栏', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    })
    try {
      function Harness() {
        const { openMobile, setOpenMobile } = useSidebar()
        return (
          <>
            <span data-testid='mobile-open'>{String(openMobile)}</span>
            <button onClick={() => setOpenMobile(true)}>open</button>
            <MemoryRouter>
              <MenuItemLink item={{ key: 'home', title: '首页', path: '/' }} />
            </MemoryRouter>
          </>
        )
      }

      render(
        <SidebarProvider>
          <Harness />
        </SidebarProvider>
      )

      fireEvent.click(screen.getByText('open'))
      expect(screen.getByTestId('mobile-open').textContent).toBe('true')

      fireEvent.click(screen.getByRole('link', { name: '首页' }))
      expect(screen.getByTestId('mobile-open').textContent).toBe('false')
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 1024,
      })
    }
  })
})
