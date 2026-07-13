import {
  ChevronRight,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'
import { Link, useMatches } from 'react-router'
import { Collapse } from '@/components/Collapse'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/ui/Sidebar'
import type { MenuItem } from './types'
import type { RouteMeta } from '@/router/types'
import { useMenu } from '@/store'
import { cn } from '@/utils/common'
import { useMemo } from 'react'

const iconMap: Record<string, LucideIcon> = {
  SquareTerminal,
  LayoutDashboard,
  Settings2,
}

const MenuItemCls = 'h-9.5 leading-none'
const MenuItemHoverCls = 'hover:bg-menu-accent'
const MenuItemActiveCls =
  'data-active:bg-menu-accent data-active:text-menu-accent-foreground hover:bg-menu-accent hover:text-menu-accent-foreground font-bold'

function renderIcon(name?: string) {
  if (!name || !iconMap[name]) return <svg />
  const Comp = iconMap[name]
  return <Comp />
}

function hasActiveDescendant(item: MenuItem, activeKey: string): boolean {
  if (!activeKey || !item.children?.length) return false
  return item.children.some(
    (child) => child.key === activeKey || hasActiveDescendant(child, activeKey)
  )
}

type TreeProps = {
  item: MenuItem
  menuKey: string
  level: number
}

function Tree({ item, menuKey, level }: TreeProps) {
  const { key, children = [] } = item
  const isActive = menuKey === key
  const isDefaultOpen = hasActiveDescendant(item, menuKey)

  const style = useMemo(
    () => ({
      paddingLeft:
        level > 0 ? `calc(var(--menu-left-padding) * ${level} + 8px)` : '',
    }),
    [level]
  )

  if (!children?.length) {
    return (
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        key={key}
        style={style}
        className={cn(
          MenuItemCls,
          !isActive && MenuItemHoverCls,
          isActive && `${MenuItemActiveCls} font-bold`
        )}
      >
        <Link
          to={item.path ?? '/'}
          className='flex items-center'
        >
          {item.icon && renderIcon(item.icon)}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapse
        key={item.key}
        title={item.title}
        defaultOpen={isDefaultOpen}
        className='[&:not([data-closed])>button>svg:last-child]:rotate-90'
        trigger={
          <SidebarMenuButton
            style={style}
            className={cn(
              MenuItemCls,
              MenuItemHoverCls,
              isDefaultOpen &&
                'text-menu-accent-foreground hover:text-menu-accent-foreground'
            )}
            tooltip={item.title}
          >
            {item.icon && renderIcon(item.icon)}
            <span className='whitespace-nowrap'>{item.title}</span>
            <ChevronRight className='ml-auto transition-transform' />
          </SidebarMenuButton>
        }
      >
        <SidebarMenuSub
          key={item.key}
          className='mx-0 border-l-0 px-0'
        >
          {children.map((subItem) => (
            <Tree
              key={subItem.key}
              item={subItem}
              menuKey={menuKey}
              level={level + 1}
            />
          ))}
        </SidebarMenuSub>
      </Collapse>
    </SidebarMenuItem>
  )
}

export default function Menus() {
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''
  const menus = useMenu((s) => s.menus)
  return (
    <SidebarGroup>
      <SidebarMenu className='gap-1'>
        {menus.map((item) => {
          return (
            <Tree
              key={item.key}
              item={item}
              menuKey={menuKey}
              level={0}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
