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
  it('nests hidden user detail under the users route with a relative path', () => {
    const system = findRoute(routes, (route) => route.path === '/system')
    const users = system?.children?.find((route) => route.path === 'users')
    const detail = users?.children?.find((route) => route.path === ':id')

    expect(detail).toBeDefined()
    expect(detail?.path).toBe(':id')
    expect(detail?.meta).toEqual({
      title: '用户详情',
      menuKey: 'system-users',
      showInMenu: false,
    })
    expect(detail?.element).toBeDefined()
  })

  it('nests role detail under the roles route and keeps it hidden from menus', () => {
    const system = findRoute(routes, (route) => route.path === '/system')
    const roles = system?.children?.find((route) => route.path === 'roles')
    const detail = roles?.children?.find((route) => route.path === 'detail')

    expect(detail?.meta).toEqual({
      title: '角色管理详情',
      menuKey: 'system-roles',
      showInMenu: false,
    })
  })

  it('keeps 404 routes outside the application layout', () => {
    const guard = routes[0]
    const layout = guard.children?.find(
      (route) => route.element === routes[0].children?.[0].element
    )
    const notFoundRoutes = guard.children?.filter(
      (route) => route.id === '404-page' || route.id === '404-catch'
    )

    expect(layout?.children?.some((route) => route.id === '404-page')).toBe(
      false
    )
    expect(layout?.children?.some((route) => route.id === '404-catch')).toBe(
      false
    )
    expect(notFoundRoutes?.map((route) => route.id)).toEqual([
      '404-page',
      '404-catch',
    ])
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
