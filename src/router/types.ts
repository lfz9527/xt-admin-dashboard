import type { RouteObject } from 'react-router'

export type RouteMeta = RouteObject['handle'] & {
  /**
   * 页面标题
   */
  title?: string
  /**
   * 环境列表
   */
  env?: string[]
}

export type AppRouteObject = RouteObject & {
  meta?: RouteMeta
  children?: AppRouteObject[]
  envs?: string[]
}
