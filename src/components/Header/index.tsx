import { SidebarTrigger } from '@/ui/Sidebar'

export default function Header() {
  return (
    <header className='flex shrink-0 items-center gap-2 border-b pb-2'>
      <SidebarTrigger />
    </header>
  )
}
