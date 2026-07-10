import {
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/ui/Sidebar'

import Logo from '@/components/Logo'

export default function MenuHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <div className='text-sidebar-primary-foreground flex items-center gap-4'>
              <Logo />
              <div className='whitespace-nowrap'>XT-DASHBOARD</div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
