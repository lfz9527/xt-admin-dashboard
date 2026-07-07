import type { AppRouteObject } from './types'
import { Lazy } from '@/components/LazyImport'
import BasicGuard from './guards/BasicGuard'

const routes: AppRouteObject[] = [
  {
    element: <BasicGuard />,
    children: [
      {
        path: '/',
        element: Lazy(() => import('@/pages/home')),
        meta: { title: '首页' },
      },
      {
        path: '/login',
        element: Lazy(() => import('@/pages/login')),
        meta: { title: '登陆' },
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
]

export default routes
