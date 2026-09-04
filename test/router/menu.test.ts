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

  it('passes openIn through to the menu item', () => {
    expect(
      routeToMenus([
        route('/dashboard', {
          title: 'Dashboard',
          menuKey: 'dashboard',
          openIn: 'newTab',
        }),
      ])
    ).toEqual([
      {
        key: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        openIn: 'newTab',
      },
    ])
  })

  it('omits openIn when the route does not configure it', () => {
    expect(
      routeToMenus([
        route('/dashboard', {
          title: 'Dashboard',
          menuKey: 'dashboard',
        }),
      ])
    ).toEqual([
      {
        key: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
      },
    ])
  })

  it('sorts sibling menus by menuOrder with unconfigured ones last', () => {
    expect(
      routeToMenus([
        route('/first', { title: 'First', menuKey: 'first', menuOrder: 0 }),
        route('/middle', { title: 'Middle', menuKey: 'middle' }),
        route('/second', { title: 'Second', menuKey: 'second', menuOrder: 1 }),
        route('/last', { title: 'Last', menuKey: 'last' }),
      ])
    ).toEqual([
      { key: 'first', title: 'First', path: '/first', menuOrder: 0 },
      { key: 'second', title: 'Second', path: '/second', menuOrder: 1 },
      { key: 'middle', title: 'Middle', path: '/middle' },
      { key: 'last', title: 'Last', path: '/last' },
    ])
  })

  it('sorts nested menus within their parent by menuOrder', () => {
    expect(
      routeToMenus([
        route('/system', { title: 'System', menuKey: 'system' }, [
          route('dict', { title: 'Dict', menuKey: 'dict', menuOrder: 2 }),
          route('users', { title: 'Users', menuKey: 'users', menuOrder: 1 }),
        ]),
      ])
    ).toEqual([
      {
        key: 'system',
        title: 'System',
        path: '/system',
        children: [
          { key: 'users', title: 'Users', path: '/system/users', menuOrder: 1 },
          { key: 'dict', title: 'Dict', path: '/system/dict', menuOrder: 2 },
        ],
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
