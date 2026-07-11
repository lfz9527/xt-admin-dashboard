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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/ui/Sidebar'
import type { MenuItem } from './types'
import type { RouteMeta } from '@/router/types'
import { useMenu } from '@/store'
import { cn } from '@/utils/common'

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

function renderSubItems(children: MenuItem[], activeKey: string) {
  return (
    <SidebarMenuSub className='mx-0 border-l-0 px-0'>
      {children.map((child) => {
        const isActive = child.key === activeKey
        return (
          <SidebarMenuSubItem key={child.key}>
            <SidebarMenuSubButton
              isActive={isActive}
              className={cn(
                MenuItemCls,
                isActive ? MenuItemActiveCls : MenuItemHoverCls,
                'pl-2'
              )}
              render={
                <Link
                  to={child.path ?? '/'}
                  className='whitespace-nowrap'
                >
                  {renderIcon(child.icon)}
                  <span>{child.title}</span>
                </Link>
              }
            />
          </SidebarMenuSubItem>
        )
      })}
    </SidebarMenuSub>
  )
}

function renderItems(item: MenuItem, isActive: boolean) {
  return (
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={cn(
          MenuItemCls,
          !isActive && MenuItemHoverCls,
          isActive && `${MenuItemActiveCls} font-bold`
        )}
      >
        <Link
          to={item.path ?? '#'}
          className='flex items-center'
        >
          {renderIcon(item.icon)}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function renderCollage(
  item: MenuItem,
  hasActiveChild: boolean,
  menuKey: string
) {
  return (
    <Collapse
      key={item.key}
      title={item.title}
      defaultOpen={hasActiveChild}
      wrapper={<SidebarMenuItem />}
      trigger={
        <SidebarMenuButton
          className={cn(
            MenuItemCls,
            MenuItemHoverCls,
            hasActiveChild &&
              'text-menu-accent-foreground hover:text-menu-accent-foreground'
          )}
          tooltip={item.title}
        >
          {renderIcon(item.icon)}
          <span className='whitespace-nowrap'>{item.title}</span>
          <ChevronRight className='ml-auto transition-transform duration-300 group-data-open/collapsible:rotate-90' />
        </SidebarMenuButton>
      }
    >
      {renderSubItems(item.children!, menuKey)}
    </Collapse>
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
          const isActive = item.key === menuKey
          const hasChildren = item.children && item.children.length > 0

          if (hasChildren) {
            const hasActiveChild = item.children!.some((c) => c.key === menuKey)

            return renderCollage(item, hasActiveChild, menuKey)
          }

          return renderItems(item, isActive)
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
