import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { logger } from './middleware/logger'
import { getSystemTheme } from '@/utils/common'

type Theme = 'light' | 'dark'

type State = {
  theme: Theme
}

type Action = {
  setTheme: (theme: Theme) => void
}

const useSetting = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set) => ({
          theme: getSystemTheme(),
          setTheme: (theme: Theme) => set({ theme }),
        }),
        {
          name: 'app-setting',
          storage: createJSONStorage(() => localStorage),
        }
      )
    ),
    'useSetting'
  )
)

export default useSetting
