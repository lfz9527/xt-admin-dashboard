import { useEffect, useMemo } from 'react'
import { useLocation, useMatches } from 'react-router'
import { useNavTab } from './context'
import type { RouteMeta } from '@/router/types'

/**
 * 路由变化时自动将当前页面同步为导航标签。
 * 标签 id 使用路由路径，标题取自路由 meta.title。
 */
export function NavTabSync() {
  const location = useLocation()
  const matches = useMatches()
  const { addTab, setActiveTab } = useNavTab()

  const title = useMemo(() => {
    const currentMatch = matches[matches.length - 1]
    return (currentMatch?.handle as RouteMeta)?.title ?? location.pathname
  }, [matches, location.pathname])

  useEffect(() => {
    addTab({ id: location.pathname, title })
    setActiveTab(location.pathname)
  }, [location.pathname, title, addTab, setActiveTab])

  return null
}
