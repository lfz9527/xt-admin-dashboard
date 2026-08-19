import { describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

import { ProgressProvider } from '@bprogress/react'
import { Settings2 } from 'lucide-react'
import { render, renderHook, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import routes from '@/router/routes'
import { routeToMenus } from '@/router/menu'
import { buildRouter } from '@/router/utils'
import { useMenuBreadcrumb } from '@/components/Breadcrumb/useMenuBreadcrumb'

describe('三级菜单', () => {
  it('派生出完整的三级菜单层级', () => {
    const menus = routeToMenus(routes)
    const first = menus.find((menu) => menu.key === 'level-one')

    expect(first).toEqual({
      key: 'level-one',
      title: '一级菜单',
      path: '/level-one',
      icon: Settings2,
      children: [
        {
          key: 'level-two',
          title: '二级菜单',
          path: '/level-one/level-two',
          children: [
            {
              key: 'level-three',
              title: '三级菜单',
              path: '/level-one/level-two/level-three',
            },
          ],
        },
      ],
    })
  })

  it('三级路径渲染页面并生成三级面包屑', async () => {
    const router = createMemoryRouter(buildRouter(routes), {
      initialEntries: ['/level-one/level-two/level-three'],
    })

    render(
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    )

    expect(await screen.findByText('三级菜单页面')).toBeInTheDocument()

    const { result } = renderHook(() =>
      useMenuBreadcrumb(
        routeToMenus(routes),
        'level-three',
        undefined,
        '/level-one/level-two/level-three'
      )
    )

    expect(result.current).toEqual([
      { label: '一级菜单', href: '/level-one' },
      { label: '二级菜单', href: '/level-one/level-two' },
      { label: '三级菜单', href: undefined },
    ])
  })
})
