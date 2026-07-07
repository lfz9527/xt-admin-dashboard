import Main from './main'
import { MenuProvider, Menu, MenuContent } from '@/components/Menu'

export default function BaseLayout() {
  return (
    <MenuProvider>
      <Menu />
      <MenuContent>
        <Main />
      </MenuContent>
    </MenuProvider>
  )
}
