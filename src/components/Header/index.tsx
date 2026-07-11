import { Moon, Sun } from 'lucide-react'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Separator } from '@/ui/Separator'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full justify-between gap-2 px-2'>
        <div className='flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600'>
          <SidebarTrigger />
          {!isMobile && (
            <>
              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:self-auto data-[orientation=vertical]:h-4'
              />
              <Breadcrumb
                items={[
                  { label: '首页', href: '/' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: '系统管理', href: '/system' },
                  { label: '用户管理', href: '/system/users' },
                  { label: '编辑用户', href: '/system/users/1' },
                  { label: '权限设置', href: '/system/users/1/permissions' },
                  { label: '角色分配', href: '/system/users/1/roles' },
                  { label: '确认' },
                ]}
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
