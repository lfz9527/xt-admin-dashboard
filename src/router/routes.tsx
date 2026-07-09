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
            meta: { title: '首页', menuKey: 'home' },
          },
          {
            path: '/dashboard',
            element: Lazy(() => import('@/pages/dashboard')),
            meta: { title: 'dashboard', menuKey: 'dashboard' },
          },
          {
            path: '/dashboard/overview',
            element: Lazy(() => import('@/pages/dashboard/overview')),
            meta: { title: '概览', menuKey: 'dashboard-overview' },
          },
          {
            path: '/dashboard/analytics',
            element: Lazy(() => import('@/pages/dashboard/analytics')),
            meta: { title: '分析', menuKey: 'dashboard-analytics' },
          },
          {
            path: '/system',
            element: Lazy(() => import('@/pages/system')),
            meta: { title: 'system', menuKey: 'system' },
          },
          {
            path: '/system/users',
            element: Lazy(() => import('@/pages/system/users')),
            meta: { title: '用户管理', menuKey: 'system-users' },
          },
          {
            path: '/system/users/:id',
            element: Lazy(() => import('@/pages/system/users/detail')),
            meta: { title: '用户详情', menuKey: 'system-users' },
          },
          {
            path: '/system/roles',
            element: Lazy(() => import('@/pages/system/roles')),
            meta: { title: '角色管理', menuKey: 'system-roles' },
          },
          {
            path: '/404',
            element: Lazy(() => import('@/pages/404')),
            meta: { title: '404' },
          },
          {
            path: '*',
            element: Lazy(() => import('@/pages/404')),
            meta: { title: '404' },
          },
        ],
      },
      {
        path: '/login',
        element: Lazy(() => import('@/pages/login')),
        meta: { title: '登陆' },
      },
    ],
  },
]

export default routes
