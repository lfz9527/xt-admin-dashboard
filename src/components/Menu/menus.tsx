import {
  ChevronRight,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
} from 'lucide-react'
import { Link } from 'react-router'
import { Collapse } from '@/components/Collapse'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/ui/Sidebar'
import type { MenuItem } from './types'

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
      {
        key: 'system-users',
        title: '用户管理',
        path: '/system/users',
        children: [
          { key: 'system-user-1', title: '张三', path: '/system/users/1' },
          { key: 'system-user-2', title: '李四', path: '/system/users/2' },
        ],
      },
      { key: 'system-roles', title: '角色管理', path: '/system/roles' },
    ],
  },
]

function renderSubItems(children: MenuItem[]) {
  return (
    <SidebarMenuSub>
      {children.map((child) => {
        const hasChildren = child.children && child.children.length > 0

        if (hasChildren) {
          return (
            <Collapse
              key={child.key}
              title={child.title}
              keepMounted
              triggerCls='text-sidebar-foreground'
              trigger={
                <SidebarMenuSubButton
                  render={
                    <span className='whitespace-nowrap'>
                      <span>{child.title}</span>
                      <ChevronRight className='ml-auto size-3 transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                    </span>
                  }
                />
              }
            >
              {renderSubItems(child.children!)}
            </Collapse>
          )
        }

        return (
          <SidebarMenuSubItem key={child.key}>
            <SidebarMenuSubButton
              render={
                <Link
                  to={child.path ?? '/'}
                  className='cursor-pointer whitespace-nowrap'
                >
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

const collapseItems = menus
  .filter((item) => item.children && item.children.length > 0)
  .map((item) => ({
    key: item.key,
    title: item.title,
    wrapper: <SidebarMenuItem />,
    trigger: (
      <SidebarMenuButton tooltip={item.title}>
        {item.icon}
        <span className='whitespace-nowrap'>{item.title}</span>
        <ChevronRight className='ml-auto transition-transform duration-300 group-data-open/collapsible:rotate-90' />
      </SidebarMenuButton>
    ),
    children: renderSubItems(item.children!),
  }))

const leafItems = menus.filter(
  (item) => !item.children || item.children.length === 0
)

export default function Menus() {
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {leafItems.map((item) => (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
            >
              <Link to={item.path ?? '#'}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {collapseItems.map(({ key, ...item }) => (
          <Collapse
            key={key}
            {...item}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
