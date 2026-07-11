import { Moon, Sun } from 'lucide-react'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import Breadcrumb from '@/components/Breadcrumb'
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
              <Breadcrumb />
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
