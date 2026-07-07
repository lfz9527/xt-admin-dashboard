import { type RouteObject } from 'react-router'

import type { AppRouteObject } from '../types'
import { getCurEnv } from '@/utils/common'

export function buildRouter(routes: AppRouteObject[]): RouteObject[] {
  const curEnv = getCurEnv()

  const convert = (route: AppRouteObject): RouteObject | null => {
    const { envs, meta = {}, children, index, ...args } = route

    if (envs && envs.length > 0 && !envs.includes(curEnv)) {
      return null
    }
    const handle = { ...(meta || {}), ...(args.handle || {}) }

    let finalChildren: RouteObject[] | undefined = undefined

    if (!index && children) {
      finalChildren = children
        .map(convert)
        .filter((r): r is RouteObject => r !== null) // 过滤掉被环境排除的子路由
    }

    return {
      ...args,
      handle,
      children: finalChildren?.length ? finalChildren : undefined,
    }
  }

  return routes.map(convert).filter((r): r is RouteObject => r !== null)
}
