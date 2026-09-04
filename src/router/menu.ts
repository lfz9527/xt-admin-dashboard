import type { MenuItem } from '@/components/Menu/types'
import {
  allowAllPermissions,
  hasRoutePermission,
  type PermissionChecker,
} from './permissions'
import type { AppRouteObject } from './types'

export { allowAllPermissions } from './permissions'

const joinRoutePath = (
  parentPath: string,
  routePath: string | undefined
): string | undefined => {
  if (routePath === undefined) return parentPath || undefined
  if (routePath.startsWith('/')) return routePath
  if (!parentPath) return `/${routePath}`
  return `${parentPath.replace(/\/$/, '')}/${routePath}`
}

/** 同级菜单排序：menuOrder 升序；未配置的排最后并保持声明顺序（sort 为稳定排序） */
const sortMenus = (menus: MenuItem[]): MenuItem[] =>
  [...menus].sort(
    (a, b) =>
      (a.menuOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.menuOrder ?? Number.MAX_SAFE_INTEGER)
  )

export function routeToMenus(
  routes: AppRouteObject[],
  checker: PermissionChecker = allowAllPermissions
): MenuItem[] {
  const convert = (route: AppRouteObject, parentPath: string): MenuItem[] => {
    if (!hasRoutePermission(route.meta, checker)) return []

    const path = joinRoutePath(parentPath, route.path)
    const children = sortMenus(
      route.children?.flatMap((child) => convert(child, path ?? '')) ?? []
    )

    if (
      route.meta?.showInMenu === false ||
      !route.meta?.menuKey ||
      !route.meta?.title
    ) {
      return children
    }

    const hasDeniedChildren = route.children?.every(
      (child) =>
        child.meta?.permission !== undefined &&
        !hasRoutePermission(child.meta, checker)
    )

    if (hasDeniedChildren && children.length === 0) return []

    return [
      {
        key: route.meta.menuKey,
        title: route.meta.title,
        ...(route.meta.icon ? { icon: route.meta.icon } : {}),
        ...(path ? { path } : {}),
        ...(route.meta.openIn ? { openIn: route.meta.openIn } : {}),
        ...(route.meta.menuOrder !== undefined
          ? { menuOrder: route.meta.menuOrder }
          : {}),
        ...(children.length ? { children } : {}),
      },
    ]
  }

  return sortMenus(routes.flatMap((route) => convert(route, '')))
}

/** 按渲染顺序（自上而下）取菜单树中第一个可跳转的叶子菜单；整树无叶子时返回 undefined */
export function firstLeafMenu(menus: MenuItem[]): MenuItem | undefined {
  for (const menu of menus) {
    if (menu.children?.length) {
      const child = firstLeafMenu(menu.children)
      if (child) return child
    } else if (menu.path) {
      return menu
    }
  }
  return undefined
}
