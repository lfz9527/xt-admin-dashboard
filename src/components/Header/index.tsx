import { Moon, Sun } from 'lucide-react'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import Logo from '@/components/Logo'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()

  return (
    <header className='flex shrink-0 items-center gap-2 border-b pb-2'>
      {isMobile && <Logo />}

      <SidebarTrigger />
      <Button
        variant='ghost'
        size='icon-sm'
        className='ml-auto'
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
    </header>
  )
}
