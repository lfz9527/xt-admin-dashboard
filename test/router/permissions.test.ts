import { describe, expect, it, vi } from 'vitest'
import { allowAllPermissions, hasRoutePermission } from '@/router/permissions'

describe('route permissions', () => {
  it('无权限声明时允许访问', () => {
    expect(hasRoutePermission({ title: '首页' }, () => false)).toBe(true)
  })

  it('声明单个权限时交给权限检查器', () => {
    const checker = vi.fn(() => false)

    expect(
      hasRoutePermission({ permission: 'system:users:view' }, checker)
    ).toBe(false)
    expect(checker).toHaveBeenCalledWith('system:users:view')
  })

  it('声明权限数组时交给权限检查器', () => {
    const checker = vi.fn(() => true)
    const permission = ['system:users:view', 'system:users:edit']

    expect(hasRoutePermission({ permission }, checker)).toBe(true)
    expect(checker).toHaveBeenCalledWith(permission)
  })

  it('allowAllPermissions 允许现有路由', () => {
    expect(
      hasRoutePermission(
        { title: '首页', permission: 'dashboard:view' },
        allowAllPermissions
      )
    ).toBe(true)
  })
})
