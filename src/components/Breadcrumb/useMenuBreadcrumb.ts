import { useMemo } from 'react'
import type { MenuItem } from '@/components/Menu/types'
import type { BreadcrumbItemData } from './breadcrumb'

/**
 * DFS 在菜单树中查找 menuKey 对应的节点，返回从根到该节点的路径。
 * 找不到时返回 null。
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

function menuPathToBreadcrumb(path: MenuItem[]): BreadcrumbItemData[] {
  return path.map((item, index) => {
    const isLast = index === path.length - 1
    return {
      label: item.title,
      // 末节点不传 href，渲染为当前页文本不可点击
      href: isLast ? undefined : item.path,
    }
  })
}

export function useMenuBreadcrumb(
  menus: MenuItem[],
  menuKey: string,
  fallbackTitle?: string
): BreadcrumbItemData[] {
  return useMemo(() => {
    if (!menuKey) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }
    const path = findMenuPath(menus, menuKey)
    if (!path) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }
    return menuPathToBreadcrumb(path)
  }, [menus, menuKey, fallbackTitle])
}
