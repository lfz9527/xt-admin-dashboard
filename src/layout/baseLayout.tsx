import Main from './main'
import { MenuProvider, Menu, MenuContent } from '@/components/Menu'
import { useMenu } from '@/store'

export default function BaseLayout() {
  const sidebarOpen = useMenu((s) => s.sidebarOpen)
  const setSidebarOpen = useMenu((s) => s.setSidebarOpen)

  return (
    <MenuProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <Menu />
      <MenuContent>
        <Main />
      </MenuContent>
    </MenuProvider>
  )
}
