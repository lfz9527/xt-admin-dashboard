import type { LucideIcon } from 'lucide-react'
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
  icon?: LucideIcon
  /**
   * 是否显示在菜单中
   */
  showInMenu?: boolean
  /**
   * 访问所需权限
   */
  permission?: string | string[]
  /**
   * 打开方式：默认当前标签页内跳转；newTab 时点击菜单在新浏览器标签页打开
   */
  openIn?: 'newTab'
  /**
   * 同级菜单排序权重：升序排列；未配置的排在已配置之后，并按路由声明顺序保持相对位置
   */
  menuOrder?: number
}

export type AppRouteObject = Omit<RouteObject, 'children'> & {
  meta?: RouteMeta
  children?: AppRouteObject[]
  envs?: string[]
}
