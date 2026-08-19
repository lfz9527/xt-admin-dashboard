import type { MenuItem } from '@/components/Menu/types'
import {
  allowAllPermissions,
  hasRoutePermission,
  type PermissionChecker,
} from './permissions'
import type { AppRouteObject } from './types'

const joinRoutePath = (
  parentPath: string,
  routePath: string | undefined
): string | undefined => {
  if (routePath === undefined) return parentPath || undefined
  if (routePath.startsWith('/')) return routePath
  if (!parentPath) return `/${routePath}`
  return `${parentPath.replace(/\/$/, '')}/${routePath}`
}

export function routeToMenus(
  routes: AppRouteObject[],
  checker: PermissionChecker = allowAllPermissions
): MenuItem[] {
  const convert = (route: AppRouteObject, parentPath: string): MenuItem[] => {
    if (!hasRoutePermission(route.meta, checker)) return []

    const path = joinRoutePath(parentPath, route.path)
    const children =
      route.children?.flatMap((child) => convert(child, path ?? '')) ?? []

    if (
      route.meta?.showInMenu === false ||
      !route.meta?.menuKey ||
      !route.meta?.title
    ) {
      return children
    }
    if (route.children && children.length === 0) return []

    return [
      {
        key: route.meta.menuKey,
        title: route.meta.title,
        ...(route.meta.icon ? { icon: route.meta.icon } : {}),
        ...(path ? { path } : {}),
        ...(children.length ? { children } : {}),
      },
    ]
  }

  return routes.flatMap((route) => convert(route, ''))
}
