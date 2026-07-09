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

const iconMap: Record<string, LucideIcon> = {
  SquareTerminal,
  LayoutDashboard,
  Settings2,
}

function renderIcon(name?: string) {
  if (!name || !iconMap[name]) return <svg />
  const Comp = iconMap[name]
  return <Comp />
}

function renderSubItems(children: MenuItem[], activeKey: string) {
  return (
    <SidebarMenuSub>
      {children.map((child) => (
        <SidebarMenuSubItem key={child.key}>
          <SidebarMenuSubButton
            isActive={child.key === activeKey}
            render={
              <Link
                to={child.path ?? '/'}
                className='whitespace-nowrap'
              >
                <span>{child.title}</span>
              </Link>
            }
          />
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}

export default function Menus() {
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''

  const menus = useMenu((s) => s.menus)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {menus.map((item) => {
          const hasChildren = item.children && item.children.length > 0

          if (hasChildren) {
            const hasActiveChild = item.children!.some((c) => c.key === menuKey)

            return (
              <Collapse
                key={item.key}
                title={item.title}
                defaultOpen={hasActiveChild}
                wrapper={<SidebarMenuItem />}
                trigger={
                  <SidebarMenuButton tooltip={item.title}>
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

          return (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.key === menuKey}
              >
                <Link to={item.path ?? '#'}>
                  {renderIcon(item.icon)}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
