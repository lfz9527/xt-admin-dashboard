import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { logger } from './middleware/logger'
type State = {
  sidebarOpen: boolean
}

type Action = {
  setSidebarOpen: (open: boolean) => void
  toggleMenu: () => void
}

const useMenu = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set) => ({
          sidebarOpen: true,

          setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
          toggleMenu: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        }),
        {
          name: 'app-menu',
          storage: createJSONStorage(() => localStorage),
        }
      )
    ),
    'useMenu'
  )
)

export default useMenu
