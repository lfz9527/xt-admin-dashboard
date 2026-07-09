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
            meta: { title: '首页' },
          },
          {
            path: '/dashboard',
            element: Lazy(() => import('@/pages/dashboard')),
            meta: { title: 'dashboard' },
          },
          {
            path: '/system',
            element: Lazy(() => import('@/pages/system')),
            meta: { title: 'system' },
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
