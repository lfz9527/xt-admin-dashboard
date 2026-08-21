import { LogOut, Moon, Sun } from 'lucide-react'
import { useMatches, useLocation, useNavigate } from 'react-router'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import { Breadcrumb, useMenuBreadcrumb } from '@/components/Breadcrumb'
import { Separator } from '@/ui/Separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Avatar'
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
import { allowAllPermissions, routeToMenus } from '@/router/menu'
import { useMemo } from 'react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()
  const menus = useMemo(() => routeToMenus(routes, allowAllPermissions), [])
  const navigate = useNavigate()
  const user = useAuthor((state) => state.user)
  const setToken = useAuthor((state) => state.setToken)
  const setUser = useAuthor((state) => state.setUser)
  const { runAsync: runLogout } = useLogout()

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
      setToken('')
      setUser(null)
      navigate('/login', { replace: true })
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
            <DropdownMenuTrigger className='rounded-full outline-none'>
              <Avatar className='cursor-pointer'>
                <AvatarImage
                  src={user?.avatar || defaultAvatar}
                  alt={user?.nickname}
                />
                <AvatarFallback>{user?.nickname?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                variant='destructive'
                onClick={handleLogout}
              >
                <LogOut />
                退出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
