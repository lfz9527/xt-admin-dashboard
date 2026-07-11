import { useMemo } from 'react'
import type { MenuItem } from '@/components/Menu/types'
import type { BreadcrumbItemData } from './breadcrumb'

/**
 * DFS 在菜单树中查找 menuKey 对应的节点，返回从根到该节点的路径。
 */
function findMenuPath(menus: MenuItem[], targetKey: string): MenuItem[] | null {
  for (const item of menus) {
    if (item.key === targetKey) {
      return [item]
    }
    if (item.children?.length) {
      const found = findMenuPath(item.children, targetKey)
      if (found) {
        return [item, ...found]
      }
    }
  }
  return null
}

/** 将菜单树拍平为 path → key 的映射 */
function buildPathKeyMap(menus: MenuItem[]): Map<string, string> {
  const map = new Map<string, string>()
  function walk(items: MenuItem[]) {
    for (const item of items) {
      if (item.path) map.set(item.path, item.key)
      if (item.children?.length) walk(item.children)
    }
  }
  walk(menus)
  return map
}

/**
 * 从 URL pathname 逐段回退，找到最深的匹配菜单 path 对应的 menuKey。
 * 例如 /system/users/12312 → 先试 /system/users/12312，再试 /system/users，再试 /system。
 */
function findMenuKeyByPath(menus: MenuItem[], pathname: string): string | null {
  const map = buildPathKeyMap(menus)
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  for (let i = segments.length; i >= 1; i--) {
    const prefix = '/' + segments.slice(0, i).join('/')
    const key = map.get(prefix)
    if (key) return key
  }
  return null
}

function menuPathToBreadcrumb(path: MenuItem[]): BreadcrumbItemData[] {
  return path.map((item, index) => {
    const isLast = index === path.length - 1
    return {
      label: item.title,
      href: isLast ? undefined : item.path,
    }
  })
}

/**
 * 菜单路径末节点 path 与当前 URL pathname 之间的尾部段，作为纯文本追加。
 */
function extractTrailingSegments(
  pathname: string,
  menuPath: MenuItem[]
): { label: string }[] {
  const lastMenuItem = menuPath[menuPath.length - 1]
  const menuEndPath = lastMenuItem.path
  if (!menuEndPath) return []

  const normalizedPathname = pathname.replace(/\/$/, '')
  const normalizedMenuPath = menuEndPath.replace(/\/$/, '')

  if (
    normalizedPathname === normalizedMenuPath ||
    !normalizedPathname.startsWith(normalizedMenuPath + '/')
  ) {
    return []
  }

  const trailing = normalizedPathname.slice(normalizedMenuPath.length)
  return trailing
    .split('/')
    .filter(Boolean)
    .map((segment) => ({ label: decodeURIComponent(segment) }))
}

export function useMenuBreadcrumb(
  menus: MenuItem[],
  menuKey: string,
  fallbackTitle?: string,
  pathname?: string
): BreadcrumbItemData[] {
  return useMemo(() => {
    // menuKey 为空时（路由未匹配），尝试从 URL pathname 推导
    const effectiveKey =
      menuKey || (pathname ? (findMenuKeyByPath(menus, pathname) ?? '') : '')

    if (!effectiveKey) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }

    const path = findMenuPath(menus, effectiveKey)
    if (!path) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }

    const base = menuPathToBreadcrumb(path)

    if (pathname) {
      const trailing = extractTrailingSegments(pathname, path)
      if (trailing.length > 0) {
        return [...base, ...trailing]
      }
    }

    return base
  }, [menus, menuKey, fallbackTitle, pathname])
}
