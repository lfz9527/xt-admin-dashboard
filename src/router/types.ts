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
  /**
   * 菜单图标
   */
  icon?: string
  /**
   * 是否显示在菜单中
   */
  showInMenu?: boolean
  /**
   * 访问所需权限
   */
  permission?: string | string[]
}

export type AppRouteObject = RouteObject & {
  meta?: RouteMeta
  children?: AppRouteObject[]
  envs?: string[]
}
