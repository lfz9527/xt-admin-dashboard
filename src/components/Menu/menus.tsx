import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation, useMatches } from 'react-router'
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
import { cn } from '@/utils/common'
import { useMemo } from 'react'
import routes from '@/router/routes'
import useAuthor from '@/store/useAuthor'
import { routeToMenus } from '@/router/menu'
import { createRoleChecker } from '@/router/permissions'

const MenuItemCls = 'h-9.5 leading-none'
const MenuItemHoverCls = 'hover:bg-menu-accent'
const MenuItemActiveCls =
  'data-active:bg-menu-accent data-active:text-menu-accent-foreground hover:bg-menu-accent hover:text-menu-accent-foreground font-bold'

function renderIcon(Icon?: LucideIcon) {
  return Icon ? <Icon /> : null
}

/** 叶子菜单链接：openIn=newTab 时交给浏览器在新标签页打开（Link 对非 _self 目标不拦截） */
export function MenuItemLink({
  item,
  ...props
}: { item: MenuItem } & Omit<React.ComponentProps<typeof Link>, 'to'>) {
  return (
    <Link
      to={item.path ?? '/'}
      {...props}
      className={cn('flex items-center', props.className)}
      {...(item.openIn === 'newTab'
        ? { target: '_blank', rel: 'noreferrer' }
        : {})}
    >
      {renderIcon(item.icon)}
      <span>{item.title}</span>
    </Link>
  )
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
  pathname: string
  level: number
}

function Tree({ item, menuKey, pathname, level }: TreeProps) {
  const { key, children = [], path } = item
  // 精确匹配菜单 path 才点亮背景；menuKey 仅用于展开所在分组
  const isActive = pathname === path
  // 子路径页面（如用户详情 /system/users/1）仅文字高亮，不点亮背景
  const isChildActive = !!path && pathname.startsWith(`${path}/`)
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
          isActive && `${MenuItemActiveCls} font-bold`,
          !isActive &&
            isChildActive &&
            'text-menu-accent-foreground hover:text-menu-accent-foreground'
        )}
      >
        <MenuItemLink item={item} />
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
            isActive={isActive}
            className={cn(
              MenuItemCls,
              isActive ? MenuItemActiveCls : MenuItemHoverCls,
              isDefaultOpen &&
                'text-menu-accent-foreground hover:text-menu-accent-foreground'
            )}
            tooltip={item.title}
          >
            {renderIcon(item.icon)}
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
              pathname={pathname}
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
  const { pathname } = useLocation()
  const currentMatch = matches[matches.length - 1]
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''
  const roleKey = useAuthor((state) => state.roleKey)
  const menus = useMemo(
    () => routeToMenus(routes, createRoleChecker(roleKey)),
    [roleKey]
  )
  return (
    <SidebarGroup>
      <SidebarMenu className='gap-1'>
        {menus.map((item) => {
          return (
            <Tree
              key={item.key}
              item={item}
              menuKey={menuKey}
              pathname={pathname}
              level={0}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
