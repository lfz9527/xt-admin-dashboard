import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LayoutDashboard, Settings2, SquareTerminal } from 'lucide-react'
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

import routes from '@/router/routes'
import { routeToMenus, allowAllPermissions } from '@/router/menu'
import { buildRouter } from '@/router/utils'
import useMenu from '@/store/useMenu'

describe('Menus', () => {
  it('derives dashboard and system menu hierarchy from routes', () => {
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
      'dashboard',
      'dashboard-overview',
      'dashboard-analytics',
      'system',
      'system-users',
      'system-roles',
      'level-one',
      'level-two',
      'level-three',
    ])
    expect(menus[0]).toMatchObject({ key: 'home', icon: SquareTerminal })
    expect(menus[1]).toMatchObject({
      key: 'dashboard',
      icon: LayoutDashboard,
    })
    expect(menus[2]).toMatchObject({ key: 'system', icon: Settings2 })
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
    expect(await screen.findByText(/users/)).toBeInTheDocument()
    expect(await screen.findByText(/user detail/)).toBeInTheDocument()
    expect((await screen.findAllByText('123')).length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByRole('link', { name: '用户管理' })
        .find((link) => link.getAttribute('aria-current') === 'page')
    ).toHaveAttribute('href', '/system/users')

    await act(async () => {
      await router.navigate('/system/roles/detail')
    })

    expect((await screen.findAllByText('角色管理')).length).toBeGreaterThan(0)
    expect(await screen.findByText(/roles/)).toBeInTheDocument()
    expect(await screen.findByText(/roles-detail/)).toBeInTheDocument()
    expect((await screen.findAllByText('角色管理详情')).length).toBeGreaterThan(
      0
    )
    expect(screen.queryByText('detail')).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: '角色管理' })
        .find((link) => link.getAttribute('aria-current') === 'page')
    ).toHaveAttribute('href', '/system/roles')
  })

  it('父级菜单在自身路由激活时保持高亮', async () => {
    const router = createMemoryRouter(buildRouter(routes), {
      initialEntries: ['/system'],
    })

    render(
      <SidebarProvider>
        <ProgressProvider>
          <RouterProvider router={router} />
        </ProgressProvider>
      </SidebarProvider>
    )

    const systemButton = await screen.findByRole('button', {
      name: '系统管理',
    })
    expect(systemButton).toHaveAttribute('data-active', 'true')
  })

  it('keeps only sidebar state in the menu store', () => {
    const state = useMenu.getState()

    expect(state).not.toHaveProperty('menus')
    expect(localStorage.getItem('app-menu')).toBeNull()
  })
})
