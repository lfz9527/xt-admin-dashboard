import type { RouteMeta } from './types'

export type PermissionChecker = (
  permission: string | string[] | undefined
) => boolean

export const allowAllPermissions: PermissionChecker = () => true

export const hasRoutePermission = (
  meta: RouteMeta | undefined,
  checker: PermissionChecker
): boolean => {
  if (meta?.permission === undefined) {
    return true
  }

  return checker(meta.permission)
}

/** 超级管理员角色编码（与后端角色表约定） */
export const SUPER_ADMIN_ROLE_KEY = 'admin'

/** 基于当前用户角色构造检查器：超级管理员恒放行；其余按声明角色码匹配 */
export const createRoleChecker =
  (roleKey: string | null): PermissionChecker =>
  (permission) => {
    if (permission === undefined) return true
    if (roleKey === SUPER_ADMIN_ROLE_KEY) return true
    if (roleKey === null) return false
    const required = Array.isArray(permission) ? permission : [permission]
    return required.includes(roleKey)
  }
