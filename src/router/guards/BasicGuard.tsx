import { useMatches, Outlet } from 'react-router'
import { useDocumentTitle } from '@/hooks'
import { useCallback, useEffect, useState } from 'react'

import type { RouteMeta } from '../types'
import { APP_NAMES } from '@/constants'

export default function BasicGuard() {
  const matches = useMatches()
  const [title, setTitle] = useState('')
  useDocumentTitle(title)

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

  return <Outlet />
}
