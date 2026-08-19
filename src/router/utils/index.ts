import { type RouteObject } from 'react-router'

import type { AppRouteObject } from '../types'
import {
  allowAllPermissions,
  hasRoutePermission,
  type PermissionChecker,
} from '../permissions'
import { getCurEnv } from '@/utils/common'

export function buildRouter(
  routes: AppRouteObject[],
  checker: PermissionChecker = allowAllPermissions
): RouteObject[] {
  const curEnv = getCurEnv()

  const convert = (route: AppRouteObject): RouteObject | null => {
    const { envs, meta = {}, children, index, ...args } = route

    if (
      (envs && envs.length > 0 && !envs.includes(curEnv)) ||
      !hasRoutePermission(meta, checker)
    ) {
      return null
    }
    const handle = { ...(meta || {}), ...(args.handle || {}) }

    let finalChildren: RouteObject[] | undefined = undefined

    if (!index && children) {
      finalChildren = children
        .map(convert)
        .filter((r): r is RouteObject => r !== null)
    }

    return {
      ...args,
      handle,
      // v7 每个路由必须配置 loader 函数，并开启useTransitions 才能获取路由跳转状态
      loader: () => null,
      children: finalChildren?.length ? finalChildren : undefined,
    }
  }

  return routes.map(convert).filter((r): r is RouteObject => r !== null)
}
