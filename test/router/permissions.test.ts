import { describe, expect, it, vi } from 'vitest'
import {
  SUPER_ADMIN_ROLE_KEY,
  allowAllPermissions,
  createRoleChecker,
  hasRoutePermission,
} from '@/router/permissions'

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

describe('createRoleChecker', () => {
  it('未声明权限时放行', () => {
    expect(createRoleChecker('user')(undefined)).toBe(true)
  })

  it('超级管理员恒放行（含数组声明）', () => {
    const checker = createRoleChecker(SUPER_ADMIN_ROLE_KEY)
    expect(checker('admin')).toBe(true)
    expect(checker(['user', 'editor'])).toBe(true)
  })

  it('角色码匹配时放行', () => {
    expect(createRoleChecker('editor')('editor')).toBe(true)
    expect(createRoleChecker('editor')(['user', 'editor'])).toBe(true)
  })

  it('角色码不匹配时拒绝', () => {
    expect(createRoleChecker('user')('admin')).toBe(false)
    expect(createRoleChecker('user')(['admin', 'editor'])).toBe(false)
  })

  it('角色未加载（null）时拒绝', () => {
    expect(createRoleChecker(null)('admin')).toBe(false)
  })
})
