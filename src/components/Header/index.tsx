import { Moon, Sun } from 'lucide-react'
import { useMatches, useLocation } from 'react-router'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import { Breadcrumb, useMenuBreadcrumb } from '@/components/Breadcrumb'
import { useMenu } from '@/store'
import { Separator } from '@/ui/Separator'
import type { RouteMeta } from '@/router/types'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()
  const menus = useMenu((s) => s.menus)

  const matches = useMatches()
  const { pathname } = useLocation()
  const currentMatch = matches[matches.length - 1]
  // 命中 catch-all 路由（id='404'），不展示面包屑
  const is404 = currentMatch?.id === '404'
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''
  const routeTitle = (currentMatch?.handle as RouteMeta)?.title

  const breadcrumbItems = useMenuBreadcrumb(
    menus,
    is404 ? '' : menuKey,
    routeTitle,
    pathname
  )

  console.log('breadcrumbItems', breadcrumbItems)

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
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  )
}
