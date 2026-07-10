import router from '@/router'
import { RouterProvider } from 'react-router'
import { useTheme } from '@/hooks'
import { ProgressProvider } from '@bprogress/react'

function App() {
  useTheme()

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
