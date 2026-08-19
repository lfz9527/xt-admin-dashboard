import type { RouteMeta } from './types'

export type PermissionChecker = (
  permission: string | string[] | undefined
) => boolean

export const allowAllPermissions: PermissionChecker = () => true

export const hasRoutePermission = (
  meta: RouteMeta | undefined,
  checker: PermissionChecker
): boolean => {
  if (!meta?.permission) {
    return true
  }

  return checker(meta.permission)
}
