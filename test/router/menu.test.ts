import { describe, expect, it } from 'vitest'
import type { AppRouteObject } from '@/router/types'
import { routeToMenus } from '@/router/menu'

const route = (
  path: string,
  meta?: AppRouteObject['meta'],
  children?: AppRouteObject[]
): AppRouteObject => ({
  path,
  meta,
  children,
})

describe('routeToMenus', () => {
  it('creates a menu item for a visible leaf route', () => {
    expect(
      routeToMenus([
        route('/dashboard', {
          title: 'Dashboard',
          menuKey: 'dashboard',
          icon: 'home',
        }),
      ])
    ).toEqual([
      {
        key: 'dashboard',
        title: 'Dashboard',
        icon: 'home',
        path: '/dashboard',
      },
    ])
  })

  it('creates nested directory menus from routes', () => {
    expect(
      routeToMenus([
        route('/system', { title: 'System', menuKey: 'system' }, [
          route('users', { title: 'Users', menuKey: 'users' }),
        ]),
      ])
    ).toEqual([
      {
        key: 'system',
        title: 'System',
        path: '/system',
        children: [{ key: 'users', title: 'Users', path: '/system/users' }],
      },
    ])
  })

  it('does not show a detail route but keeps visible children', () => {
    expect(
      routeToMenus([
        route('/system/users', { title: 'Users', menuKey: 'system-users' }, [
          route(':id', {
            title: 'User detail',
            menuKey: 'system-users',
            showInMenu: false,
          }),
          route('settings', { title: 'Settings', menuKey: 'user-settings' }),
        ]),
      ])
    ).toEqual([
      {
        key: 'system-users',
        title: 'Users',
        path: '/system/users',
        children: [
          {
            key: 'user-settings',
            title: 'Settings',
            path: '/system/users/settings',
          },
        ],
      },
    ])
  })

  it('hides children when the parent lacks permission', () => {
    const checker = (permission: string | string[] | undefined) =>
      permission !== 'parent'
    expect(
      routeToMenus(
        [
          route(
            '/system',
            { title: 'System', menuKey: 'system', permission: 'parent' },
            [route('users', { title: 'Users', menuKey: 'users' })]
          ),
        ],
        checker
      )
    ).toEqual([])
  })

  it('does not create an empty directory when all children lack permission', () => {
    const checker = (permission: string | string[] | undefined) =>
      permission !== 'child'
    expect(
      routeToMenus(
        [
          route(
            '/system',
            { title: 'System', menuKey: 'system', permission: 'parent' },
            [
              route('users', {
                title: 'Users',
                menuKey: 'users',
                permission: 'child',
              }),
            ]
          ),
        ],
        checker
      )
    ).toEqual([])
  })

  it('skips routes missing menu metadata', () => {
    expect(
      routeToMenus([
        route('/missing-key', { title: 'Missing key' }),
        route('/missing-title', { menuKey: 'missing-title' }),
      ])
    ).toEqual([])
  })
})
