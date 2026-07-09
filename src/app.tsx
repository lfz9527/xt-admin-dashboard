import router from '@/router'
import { RouterProvider } from 'react-router'
import { useTheme } from '@/hooks'

function App() {
  useTheme()

  return (
    <RouterProvider
      router={router}
      useTransitions={true}
    />
  )
}
export default App
