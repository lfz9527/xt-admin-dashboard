import { useEffect, useMemo } from 'react'
import { useLocation, useMatches, useParams } from 'react-router'
import { useNavTab } from './context'
import type { RouteMeta } from '@/router/types'

/**
 * 路由变化时自动将当前页面同步为导航标签。
 * 标签 id 使用路由路径，标题取自路由 meta.title，
 * 未配置时使用最后一个动态路由参数值，仍缺失时回退路径。
 */
export function NavTabSync() {
  const location = useLocation()
  const matches = useMatches()
  const params = useParams()
  const { addTab, setActiveTab } = useNavTab()

  const title = useMemo(() => {
    const currentMatch = matches[matches.length - 1]
    const metaTitle = (currentMatch?.handle as RouteMeta)?.title
    if (metaTitle) return metaTitle

    const dynamicValues = Object.values(params).filter(Boolean)
    return dynamicValues[dynamicValues.length - 1] ?? location.pathname
  }, [matches, params, location.pathname])

  useEffect(() => {
    addTab({ id: location.pathname, title })
    setActiveTab(location.pathname)
  }, [location.pathname, title, addTab, setActiveTab])

  return null
}
