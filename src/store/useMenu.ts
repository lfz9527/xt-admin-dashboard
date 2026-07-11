import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { logger } from './middleware/logger'
import type { MenuItem } from '@/components/Menu/types'

type State = {
  menus: MenuItem[]
  sidebarOpen: boolean
}

type Action = {
  setSidebarOpen: (open: boolean) => void
  toggleMenu: () => void
}

const mockMenus: MenuItem[] = [
  {
    key: 'home',
    title: '首页',
    path: '/',
    icon: 'SquareTerminal',
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    children: [
      { key: 'dashboard-overview', title: '概览', path: '/dashboard/overview' },
      {
        key: 'dashboard-analytics',
        title: '分析',
        path: '/dashboard/analytics',
      },
    ],
  },
  {
    key: 'system',
    title: '系统管理',
    icon: 'Settings2',
    children: [
      {
        key: 'system-users',
        title: '用户管理',
        path: '/system/users',
        icon: 'LayoutDashboard',
      },
      {
        key: 'system-roles',
        title: '角色管理',
        path: '/system/roles',
        icon: 'Settings2',
        children: [
          {
            key: 'system-roles-detail',
            title: '三级菜单',
            icon: 'Settings2',
            path: '/system/roles/detail',
          },
        ],
      },
    ],
  },
]

console.log(333, mockMenus)

const useMenu = create<State & Action>()(
  logger(
    devtools(
      persist(
        (set) => ({
          menus: mockMenus,
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
