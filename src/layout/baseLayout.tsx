import Main from './main'
import { MenuProvider, Menu, MenuContent } from '@/components/Menu'
import { useMenu } from '@/store'
import { NavTabProvider, NavTabSync } from './NavTab'
import { useUserInfo } from '@/features/auth/hooks'

export default function BaseLayout() {
  const sidebarOpen = useMenu((s) => s.sidebarOpen)
  const setSidebarOpen = useMenu((s) => s.setSidebarOpen)
  const maximized = useMenu((s) => s.maximized)

  // 挂载即拉取当前用户信息（含角色）写入 store；401 由请求拦截器统一登出
  useUserInfo()

  return (
    <MenuProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      data-maximized={maximized ? 'true' : undefined}
    >
      <Menu />
      <MenuContent>
        <NavTabProvider>
          <NavTabSync />
          <Main />
        </NavTabProvider>
      </MenuContent>
    </MenuProvider>
  )
}
