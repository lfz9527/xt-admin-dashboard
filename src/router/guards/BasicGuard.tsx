import { Navigate, Outlet, useLocation, useMatches } from 'react-router'
import { useDocumentTitle, useProgress } from '@/hooks'
import { useCallback, useEffect, useState } from 'react'

import useAuthor from '@/store/useAuthor'
import type { RouteMeta } from '../types'
import { APP_NAMES } from '@/constants'

export default function BasicGuard() {
  const matches = useMatches()
  const { pathname } = useLocation()
  const token = useAuthor((state) => state.token)
  const [title, setTitle] = useState('')
  useDocumentTitle(title)
  useProgress()
  /**
   * 同步路由和浏览器标题
   */
  const updateTile = useCallback(() => {
    const currentMatch = matches[matches.length - 1]
    const handle: RouteMeta = currentMatch?.handle ?? {}
    const title = handle?.title || APP_NAMES

    setTitle(title)
  }, [matches])

  useEffect(updateTile, [updateTile])

  // 已登录访问登录页 → 回首页；未登录访问其他页面 → 去登录页
  // 非登录页：无 token 重定向登录页，有 token 正常路由执行
  if (pathname !== '/login' && !token) {
    return (
      <Navigate
        to='/login'
        replace
      />
    )
  }

  return (
    <>
      <Outlet />
    </>
  )
}
