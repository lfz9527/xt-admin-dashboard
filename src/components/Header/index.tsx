import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useMatches, useLocation } from 'react-router'
import { useState, useMemo } from 'react'
import UserCenterDialog from './UserCenterDialog'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import { Breadcrumb, useMenuBreadcrumb } from '@/components/Breadcrumb'
import { Separator } from '@/ui/Separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Avatar'
import { authLogout } from '@/service/request'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/DropdownMenu'
import useAuthor from '@/store/useAuthor'
import { toast } from '@/ui/Toast'
import defaultAvatar from '@/assets/icon/default-avatar.svg'
import { useLogout } from '@/features/auth/hooks'
import type { RouteMeta } from '@/router/types'
import routes from '@/router/routes'
import { routeToMenus } from '@/router/menu'
import { createRoleChecker } from '@/router/permissions'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()
  const roleKey = useAuthor((state) => state.roleKey)
  const menus = useMemo(
    () => routeToMenus(routes, createRoleChecker(roleKey)),
    [roleKey]
  )
  const user = useAuthor((state) => state.user)
  const { runAsync: runLogout } = useLogout()
  const [profileOpen, setProfileOpen] = useState(false)

  const matches = useMatches()
  const { pathname } = useLocation()
  const currentMatch = matches[matches.length - 1]
  // 命中 404 相关路由（id 以 '404' 开头），不展示面包屑
  const is404 = currentMatch?.id.startsWith('404') ?? false
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''
  const routeTitle = (currentMatch?.handle as RouteMeta)?.title

  const breadcrumbItems = useMenuBreadcrumb(
    menus,
    is404 ? '' : menuKey,
    routeTitle,
    pathname
  )

  const handleLogout = async () => {
    try {
      await runLogout()
      authLogout()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full justify-between gap-2 px-2'>
        <div className='flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600'>
          <SidebarTrigger />
          {!isMobile && !is404 && (
            <>
              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:self-auto data-[orientation=vertical]:h-4'
              />
              <Breadcrumb
                items={breadcrumbItems}
                maxItems={4}
                startCount={1}
                endCount={2}
                ellipsisDropdownItem={(item) => ({
                  label: item.label,
                  onClick: item.href
                    ? () => console.log('navigate to:', item.href)
                    : undefined,
                })}
              />
            </>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-3'>
          <div className='flex shrink-0 items-center gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  className='h-9 gap-2 rounded-full px-1.5'
                >
                  <Avatar className='cursor-pointer'>
                    <AvatarImage
                      src={user?.avatar || defaultAvatar}
                      alt={user?.nickname}
                    />
                    <AvatarFallback>
                      {user?.nickname?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='max-w-24 truncate text-sm font-medium'>
                    {user?.nickname}
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User />
                个人中心
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={handleLogout}
              >
                <LogOut />
                退出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserCenterDialog
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />
        </div>
      </div>
    </header>
  )
}
