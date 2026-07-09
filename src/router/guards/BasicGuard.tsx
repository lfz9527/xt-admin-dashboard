import { useMatches, Outlet, useNavigation } from 'react-router'
import { useDocumentTitle } from '@/hooks'
import { useCallback, useEffect, useState } from 'react'

import type { RouteMeta } from '../types'
import { APP_NAMES } from '@/constants'

export default function BasicGuard() {
  const matches = useMatches()
  const navigation = useNavigation()
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

  useEffect(() => {
    // 跳转时会连续打印 idle → loading → idle
    console.log('导航状态更新：', navigation.state)
  }, [navigation.state])

  return (
    <>
      {navigation.state === 'loading' && (
        <div className='fixed top-0 left-0 z-[9999] h-0.5 w-full overflow-hidden'>
          <div
            className='bg-primary h-full w-1/4'
            style={{ animation: 'navigate-progress 1.2s ease-in-out infinite' }}
          />
        </div>
      )}
      <Outlet />
    </>
  )
}
