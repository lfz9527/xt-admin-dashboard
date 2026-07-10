import {
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/ui/Sidebar'

import { NavLink } from 'react-router'

export default function MenuHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <NavLink
              to='/'
              className='flex items-center gap-4'
            >
              <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <img
                  src='/icon-white.svg'
                  className='size-6'
                />
              </div>
              <div className='whitespace-nowrap'>XT-DASHBOARD</div>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
