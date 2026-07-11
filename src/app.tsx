import router from '@/router'
import { RouterProvider } from 'react-router'
import { useTheme, useCommand } from '@/hooks'
import { ProgressProvider } from '@bprogress/react'
import { useMenu } from '@/store'

function App() {
  const toggleMenu = useMenu((m) => m.toggleMenu)

  useTheme()

  // 监听 Ctrl+b 自动展开和收起菜单
  useCommand('Ctrl+b', toggleMenu)

  return (
    <ProgressProvider>
      <RouterProvider
        router={router}
        useTransitions={true}
      />
    </ProgressProvider>
  )
}
export default App
