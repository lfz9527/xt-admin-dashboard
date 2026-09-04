import {
  Bookmark,
  FileText,
  Globe,
  House,
  Library,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Outlet } from 'react-router'
import type { AppRouteObject } from './types'
import { Lazy } from '@/components/LazyImport'
import BasicGuard from './guards/BasicGuard'
import PermissionGuard from './guards/PermissionGuard'
import Layout from '@/layout'

const routes: AppRouteObject[] = [
  {
    element: <BasicGuard />,
    children: [
      {
        element: <PermissionGuard />,
        children: [
          {
            element: <Layout />,
            children: [
              {
                path: '/',
                element: Lazy(() => import('@/pages/home')),
                meta: {
                  title: '首页',
                  menuKey: 'home',
                  icon: House,
                  // 固定排在菜单首位
                  menuOrder: 0,
                },
              },
              {
                meta: { title: '浏览器管理', menuKey: 'browser', icon: Globe },
                children: [
                  {
                    path: '/browser/bookmarks',
                    element: Lazy(() => import('@/pages/browser/bookmarks')),
                    meta: {
                      title: '书签管理',
                      menuKey: 'browser-bookmarks',
                      icon: Bookmark,
                      // 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
                      permission: 'admin',
                    },
                  },
                ],
              },
              {
                meta: { title: '系统管理', menuKey: 'system', icon: Settings2 },
                children: [
                  {
                    path: '/system/users',
                    element: <Outlet />,
                    meta: {
                      title: '用户管理',
                      menuKey: 'system-users',
                      icon: Users,
                      // 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
                      permission: 'admin',
                    },
                    children: [
                      {
                        path: '',
                        element: Lazy(() => import('@/pages/system/users')),
                        meta: {
                          title: '用户管理',
                          menuKey: 'system-users',
                          showInMenu: false,
                        },
                      },
                      {
                        path: ':id',
                        element: Lazy(
                          () => import('@/pages/system/users/detail')
                        ),
                        meta: {
                          title: '用户详情',
                          menuKey: 'system-users',
                          showInMenu: false,
                        },
                      },
                    ],
                  },
                  {
                    path: '/system/roles',
                    element: Lazy(() => import('@/pages/system/roles')),
                    meta: {
                      title: '角色管理',
                      menuKey: 'system-roles',
                      icon: ShieldCheck,
                      // 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
                      permission: 'admin',
                    },
                  },
                  {
                    path: '/system/dict',
                    element: Lazy(() => import('@/pages/system/dict')),
                    meta: {
                      title: '字典管理',
                      menuKey: 'system-dict',
                      icon: Library,
                      // 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
                      permission: 'admin',
                    },
                  },
                ],
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
      {
        path: '/resume',
        element: Lazy(() => import('@/pages/resume')),
        meta: {
          title: '我的简历',
          menuKey: 'resume',
          icon: FileText,
          // 点击菜单在新浏览器标签页打开（与 login 同级，不包 Layout/权限守卫）
          openIn: 'newTab',
          // 紧跟首页之后展示
          menuOrder: 1,
        },
      },
    ],
  },
]

export default routes
