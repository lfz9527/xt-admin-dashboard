import {
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/ui/Sidebar'

export default function MenuHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <a
              href='/'
              className='flex items-center gap-4'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <img
                  src='/icon-white.svg'
                  className='size-6'
                />
              </div>
              <div className='whitespace-nowrap'>XT-DASHBOARD</div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
