import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarRail,
} from '@/ui/Sidebar'

import MenuHeader from './menuHeader'
import Menus from './menus'
export function Menu({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      variant='inset'
      collapsible='icon'
      {...props}
    >
      <MenuHeader />
      <SidebarContent>
        <Menus />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export const MenuContent = SidebarInset
