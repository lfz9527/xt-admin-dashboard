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
            path: '/dashboard',
            element: Lazy(() => import('@/pages/dashboard')),
            meta: {
              title: 'Dashboard',
              menuKey: 'dashboard',
              icon: LayoutDashboard,
            },
            children: [
              {
                path: 'overview',
                element: Lazy(() => import('@/pages/dashboard/overview')),
                meta: { title: '概览', menuKey: 'dashboard-overview' },
              },
              {
                path: 'analytics',
                element: Lazy(() => import('@/pages/dashboard/analytics')),
                meta: { title: '分析', menuKey: 'dashboard-analytics' },
              },
            ],
          },
          {
            path: '/system',
            element: Lazy(() => import('@/pages/system')),
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
                children: [
                  {
                    path: ':id',
                    element: Lazy(() => import('@/pages/system/users/detail')),
                    meta: {
                      title: '用户详情',
                      menuKey: 'system-users',
                      showInMenu: false,
                    },
                  },
                ],
              },
              {
                path: 'roles',
                element: Lazy(() => import('@/pages/system/roles')),
                meta: {
                  title: '角色管理',
                  menuKey: 'system-roles',
                  icon: Settings2,
                },
                children: [
                  {
                    path: 'detail',
                    element: Lazy(() => import('@/pages/system/roles/detail')),
                    meta: {
                      title: '角色管理详情',
                      menuKey: 'system-roles',
                      showInMenu: false,
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
