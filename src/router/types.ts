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
  /**
   * 关联 MenuItem.key，用于菜单高亮
   */
  menuKey?: string
}

export type AppRouteObject = RouteObject & {
  meta?: RouteMeta
  children?: AppRouteObject[]
  envs?: string[]
}
