import { Outlet } from 'react-router'
import { MenuProvider, Menu, MenuContent } from '@/components/Menu'

export default function Layout() {
  return (
    <div className='bg-red-500'>
      <MenuProvider>
        <Menu />
        <MenuContent>
          <div className='flex flex-1 flex-col gap-4 overflow-auto p-2'>
            <Outlet />
          </div>
        </MenuContent>
      </MenuProvider>
    </div>
  )
}
