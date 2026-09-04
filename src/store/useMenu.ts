import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { logger } from './middleware/logger'
type State = {
  sidebarOpen: boolean
  /** 内容区最大化：隐藏侧边栏与顶部 Header，为临时 UI 态不做持久化 */
  maximized: boolean
}

type Action = {
  setSidebarOpen: (open: boolean) => void
  toggleMenu: () => void
  toggleMaximize: () => void
}

const useMenu = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set) => ({
          sidebarOpen: true,
          maximized: false,

          setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
          toggleMenu: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
          toggleMaximize: () => set((s) => ({ maximized: !s.maximized })),
        }),
        {
          name: 'app-menu',
          storage: createJSONStorage(() => localStorage),
          partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
        }
      )
    ),
    'useMenu'
  )
)

export default useMenu
