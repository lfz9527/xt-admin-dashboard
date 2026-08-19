import { describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})
import routes from '@/router/routes'
import type { AppRouteObject } from '@/router/types'
import { buildRouter } from '@/router/utils'

const findRoute = (
  routeList: AppRouteObject[],
  predicate: (route: AppRouteObject) => boolean
): AppRouteObject | undefined => {
  for (const route of routeList) {
    if (predicate(route)) return route
    const match = route.children && findRoute(route.children, predicate)
    if (match) return match
  }
  return undefined
}

describe('application routes', () => {
  it('associates hidden user detail with the users menu and detail component', async () => {
    const detail = findRoute(
      routes,
      (route) => route.path === '/system/users/:id'
    )

    expect(detail?.meta).toEqual({
      title: '用户详情',
      menuKey: 'system-users',
      showInMenu: false,
    })
    expect(detail?.element).toBeDefined()
    expect(detail?.element).not.toBe(
      findRoute(routes, (route) => route.path === '/system/users')?.element
    )
  })

  it('nests role detail under the roles route and keeps it hidden from menus', () => {
    const roles = findRoute(routes, (route) => route.path === '/system/roles')
    const detail = roles?.children?.find((route) => route.path === 'detail')

    expect(detail?.meta).toEqual({
      title: '角色管理详情',
      menuKey: 'system-roles',
      showInMenu: false,
    })
  })

  it('filters routes recursively with the supplied permission checker', () => {
    const result = buildRouter(
      [
        {
          path: '/public',
          element: null,
          meta: { title: '公开页' },
        },
        {
          path: '/admin',
          element: null,
          meta: { title: '管理页', permission: 'admin:view' },
        },
      ],
      () => false
    )

    expect(result.map((route) => route.path)).toEqual(['/public'])
  })

  it('keeps layout routes and only removes inaccessible descendants', () => {
    const result = buildRouter(
      [
        {
          element: null,
          children: [
            { path: 'allowed', element: null },
            {
              path: 'blocked',
              element: null,
              meta: { permission: 'blocked:view' },
            },
          ],
        },
      ],
      () => false
    )

    expect(result).toHaveLength(1)
    expect(result[0].children?.map((route) => route.path)).toEqual(['allowed'])
  })
})
