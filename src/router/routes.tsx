import { LayoutDashboard, Settings2, SquareTerminal } from 'lucide-react'
import type { AppRouteObject } from './types'
import { Lazy } from '@/components/LazyImport'
import BasicGuard from './guards/BasicGuard'
import Layout from '@/layout'

const routes: AppRouteObject[] = [
  {
    element: <BasicGuard />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: Lazy(() => import('@/pages/home')),
            meta: { title: '首页', menuKey: 'home', icon: SquareTerminal },
          },
          {
            path: '/system',
            meta: { title: '系统管理', menuKey: 'system', icon: Settings2 },
            children: [
              {
                path: 'users',
                element: Lazy(() => import('@/pages/system/users')),
                meta: {
                  title: '用户管理',
                  menuKey: 'system-users',
                  icon: LayoutDashboard,
                },
              },
              {
                path: 'roles',
                element: Lazy(() => import('@/pages/system/roles')),
                meta: {
                  title: '角色管理',
                  menuKey: 'system-roles',
                  icon: Settings2,
                },
              },
            ],
          },
        ],
      },
      {
        id: '404-page',
        path: '/404',
        element: Lazy(() => import('@/pages/404')),
        meta: { title: '404' },
      },
      {
        id: '404-catch',
        path: '*',
        element: Lazy(() => import('@/pages/404')),
        meta: { title: '404' },
      },
      {
        path: '/login',
        element: Lazy(() => import('@/pages/login')),
        meta: { title: '登录' },
      },
    ],
  },
]

export default routes
