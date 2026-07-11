import { useMemo } from 'react'
import type { BreadcrumbItemData } from './breadcrumb'
import type { DropdownItem } from '@/components/Dropdown'

/**
 * 自动折叠：超出 maxItems 时中段用省略号+dropdown 展示。
 * 如需省略号可点击跳转，必须提供 ellipsisDropdownItem 回调来定义每个折叠项的下拉行为。
 */
export function useBreadcrumbCollapse(
  items: BreadcrumbItemData[],
  maxItems?: number,
  startCount = 1,
  endCount = 1,
  ellipsisDropdownItem?: (item: BreadcrumbItemData) => DropdownItem
) {
  return useMemo(() => {
    if (!maxItems || items.length <= maxItems) return items

    const collapsed: BreadcrumbItemData[] = []
    const hidden = items.slice(startCount, items.length - endCount)

    for (let i = 0; i < startCount; i++) {
      collapsed.push(items[i])
    }

    collapsed.push({
      label: '',
      ellipsis: true,
      dropdown: ellipsisDropdownItem
        ? hidden.map(ellipsisDropdownItem)
        : undefined,
    })

    for (let i = items.length - endCount; i < items.length; i++) {
      collapsed.push(items[i])
    }

    return collapsed
  }, [items, maxItems, startCount, endCount, ellipsisDropdownItem])
}
