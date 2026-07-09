import { Moon, Sun } from 'lucide-react'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme } from '@/hooks'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className='flex shrink-0 items-center gap-2 border-b pb-2'>
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
