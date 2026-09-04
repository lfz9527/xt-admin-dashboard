import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { logger } from './middleware/logger'
import { getSystemTheme } from '@/utils/common'
import { IS_PROD } from '@/constants'
import { type Theme } from '@/types/setting'

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
      ),
      // 生产环境不连接 Redux DevTools
      { name: 'useSetting', enabled: !IS_PROD }
    ),
    'useSetting'
  )
)

export default useSetting
