import { renderHook } from '@testing-library/react'
import { useMenuBreadcrumb } from '@/components/Breadcrumb/useMenuBreadcrumb'
import type { MenuItem } from '@/components/Menu/types'

// 模拟菜单树：首页 + 系统管理 > 角色管理 > 三级菜单
const mockMenus: MenuItem[] = [
  { key: 'home', title: '首页', path: '/' },
  {
    key: 'system',
    title: '系统管理',
    path: '/system',
    children: [
      { key: 'system-users', title: '用户管理', path: '/system/users' },
      {
        key: 'system-roles',
        title: '角色管理',
        path: '/system/roles',
        children: [
          {
            key: 'system-roles-detail',
            title: '三级菜单',
            path: '/system/roles/detail',
          },
        ],
      },
    ],
  },
]

describe('useMenuBreadcrumb', () => {
  it('应返回完整菜单路径（多级嵌套）', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, 'system-roles-detail')
    )

    expect(result.current).toEqual([
      { label: '系统管理', href: '/system' },
      { label: '角色管理', href: '/system/roles' },
      { label: '三级菜单', href: undefined },
    ])
  })

  it('应返回单层路径（顶级菜单项）', () => {
    const { result } = renderHook(() => useMenuBreadcrumb(mockMenus, 'home'))

    expect(result.current).toEqual([{ label: '首页', href: undefined }])
  })

  it('menuKey 在菜单树中不存在时应退回 fallbackTitle', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, 'non-existent', '404')
    )

    expect(result.current).toEqual([{ label: '404', href: undefined }])
  })

  it('menuKey 为空字符串且无 fallbackTitle 时返回空数组', () => {
    const { result } = renderHook(() => useMenuBreadcrumb(mockMenus, ''))

    expect(result.current).toEqual([])
  })

  it('menuKey 为空字符串但有 fallbackTitle 时退回单一项', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, '', '登录')
    )

    expect(result.current).toEqual([{ label: '登录', href: undefined }])
  })

  it('菜单节点无 path 时 href 为 undefined', () => {
    const menusWithoutPath: MenuItem[] = [
      {
        key: 'container',
        title: '容器',
        children: [{ key: 'leaf', title: '叶子', path: '/leaf' }],
      },
    ]

    const { result } = renderHook(() =>
      useMenuBreadcrumb(menusWithoutPath, 'leaf')
    )

    expect(result.current).toEqual([
      { label: '容器', href: undefined },
      { label: '叶子', href: undefined },
    ])
  })

  it('pathname 超出菜单路径时应追加动态段', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(
        mockMenus,
        'system-users',
        undefined,
        '/system/users/12312'
      )
    )

    expect(result.current).toEqual([
      { label: '系统管理', href: '/system' },
      { label: '用户管理', href: undefined },
      { label: '12312', href: undefined },
    ])
  })

  it('pathname 有多段动态参数时应全部追加', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(
        mockMenus,
        'system-users',
        undefined,
        '/system/users/12312/edit/confirm'
      )
    )

    expect(result.current).toEqual([
      { label: '系统管理', href: '/system' },
      { label: '用户管理', href: undefined },
      { label: '12312', href: undefined },
      { label: 'edit', href: undefined },
      { label: 'confirm', href: undefined },
    ])
  })

  it('pathname 与菜单路径完全一致时不追加', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, 'system-users', undefined, '/system/users')
    )

    expect(result.current).toEqual([
      { label: '系统管理', href: '/system' },
      { label: '用户管理', href: undefined },
    ])
  })

  it('menus 为空数组时退回 fallbackTitle', () => {
    const { result } = renderHook(() => useMenuBreadcrumb([], 'home', '首页'))

    expect(result.current).toEqual([{ label: '首页', href: undefined }])
  })
})
