import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Header from '@/components/Header'
import { SidebarProvider } from '@/ui/Sidebar'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

import routes from '@/router/routes'
import { routeToMenus } from '@/router/menu'
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
    ])
    expect(menus.some(({ key }) => key.includes('detail'))).toBe(false)
    expect(
      menus
        .flatMap((item) => item.children ?? [])
        .some(({ key }) => key.includes('detail'))
    ).toBe(false)
  })

  it('derives Header breadcrumbs from routes instead of the menu store', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/system',
          handle: { title: 'system', menuKey: 'system' },
          children: [
            {
              path: 'users',
              handle: { title: '用户管理', menuKey: 'system-users' },
              element: <Header />,
            },
          ],
        },
      ],
      { initialEntries: ['/system/users'] }
    )

    render(
      <SidebarProvider>
        <RouterProvider router={router} />
      </SidebarProvider>
    )

    expect(screen.getByText('用户管理')).toBeInTheDocument()
  })

  it('keeps only sidebar state in the menu store', () => {
    const state = useMenu.getState()

    expect(state).not.toHaveProperty('menus')
    expect(localStorage.getItem('app-menu')).toBeNull()
  })
})
