import { type ReactNode } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/ui/Breadcrumb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
} from '@/ui/DropdownMenu'
import type { DropdownItem } from '@/components/Dropdown'
import { renderDropdownItem } from '@/components/Dropdown/dropdown'
import { useBreadcrumbCollapse } from './useBreadcrumbCollapse'

export interface BreadcrumbItemData {
  /** 显示文本 */
  label: string
  /** 链接地址，有则渲染 Link，无则渲染 Page（当前页） */
  href?: string
  /** 渲染为省略号 */
  ellipsis?: boolean
  /** 下拉菜单项，有则渲染为可展开的下拉 */
  dropdown?: DropdownItem[]
  /** 下拉触发方式，默认取 dropdownTriggerMode，不传则为 click */
  triggerMode?: 'click' | 'hover'
}

export interface BreadcrumbProps {
  /** 面包屑路径，最后一项自动渲染为当前页 */
  items: BreadcrumbItemData[]
  /** 分隔符，默认 > */
  separator?: ReactNode
  /** 最大显示项数，超出后自动折叠 */
  maxItems?: number
  /** 折叠时开头保留项数，默认 1 */
  startCount?: number
  /** 折叠时结尾保留项数，默认 1 */
  endCount?: number
  /** 自定义折叠项在下拉菜单中的渲染，({ label, href }: BreadcrumbItemData) => DropdownItem */
  ellipsisDropdownItem?: (item: BreadcrumbItemData) => DropdownItem
  /** 省略号下拉触发方式，默认 click */
  ellipsisTriggerMode?: 'click' | 'hover'
  /** item 下拉默认触发方式，单个 item 可通过 triggerMode 覆盖，默认 click */
  dropdownTriggerMode?: 'click' | 'hover'
}

export function Breadcrumb({
  items,
  separator,
  maxItems,
  startCount = 1,
  endCount = 1,
  ellipsisDropdownItem,
  ellipsisTriggerMode = 'click',
  dropdownTriggerMode = 'click',
}: BreadcrumbProps) {
  const displayItems = useBreadcrumbCollapse(
    items,
    maxItems,
    startCount,
    endCount,
    ellipsisDropdownItem
  )

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        {displayItems.reduce<ReactNode[]>((acc, item, index) => {
          const isLast = index === displayItems.length - 1

          if (item.ellipsis) {
            // 带 dropdown 的省略号 → 展开后可跳转
            if (item.dropdown?.length) {
              acc.push(
                <BreadcrumbItem key={`fold-${index}`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className='flex cursor-pointer items-center'
                      openOnHover={ellipsisTriggerMode === 'hover'}
                    >
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-36'>
                      <DropdownMenuGroup>
                        {item.dropdown.map(renderDropdownItem)}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              )
            } else {
              acc.push(
                <BreadcrumbItem key={`el-${index}`}>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
              )
            }
          } else if (item.dropdown?.length) {
            acc.push(
              <BreadcrumbItem key={`item-${index}`}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className='hover:text-foreground flex cursor-pointer items-center gap-1 transition-colors'
                    openOnHover={
                      (item.triggerMode ?? dropdownTriggerMode) === 'hover'
                    }
                  >
                    {item.label}
                    <ChevronDownIcon className='size-3' />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-40'>
                    <DropdownMenuGroup>
                      {item.dropdown.map(renderDropdownItem)}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            )
          } else {
            acc.push(
              <BreadcrumbItem key={`item-${index}`}>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<a href={item.href}>{item.label}</a>}
                  />
                )}
              </BreadcrumbItem>
            )
          }

          if (!isLast) {
            acc.push(
              <BreadcrumbSeparator key={`sep-${index}`}>
                {separator}
              </BreadcrumbSeparator>
            )
          }

          return acc
        }, [])}
      </BreadcrumbList>
    </BreadcrumbRoot>
  )
}
