import {
  ChevronRight,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
} from 'lucide-react'
import { Link, useMatches } from 'react-router'
import { Collapse } from '@/components/Collapse'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
} from '@/ui/Sidebar'
import type { MenuItem } from './types'
import type { RouteMeta } from '@/router/types'

const menus: MenuItem[] = [
  {
    key: 'home',
    title: '首页',
    path: '/',
    icon: <SquareTerminal />,
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: <LayoutDashboard />,
    children: [
      { key: 'dashboard-overview', title: '概览', path: '/dashboard/overview' },
      {
        key: 'dashboard-analytics',
        title: '分析',
        path: '/dashboard/analytics',
      },
    ],
  },
  {
    key: 'system',
    title: '系统管理',
    icon: <Settings2 />,
    children: [
      { key: 'system-users', title: '用户管理', path: '/system/users' },
      { key: 'system-roles', title: '角色管理', path: '/system/roles' },
    ],
  },
]

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
                    {item.icon}
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
                  {item.icon}
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
