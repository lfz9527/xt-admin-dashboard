import { firstLeafMenu, routeToMenus } from './menu'
import { createRoleChecker } from './permissions'
import routes from './routes'

/**
 * 从路由表派生的「菜单派生数据」单一入口。
 *
 * 独立成叶子模块的原因：routes.tsx → layout → components/Menu/menus.tsx → routes
 * 曾构成项目唯一的静态循环依赖。menus/nav-tab/Header 统一改为从这里取派生菜单，
 * 使 components/Menu 不再反向依赖 routes，环被切断；本模块不依赖 layout 与
 * components 业务组件（仅类型层引用 Menu/types，编译期擦除），不参与任何环。
 */

/** 按当前角色过滤后的完整菜单树（侧边栏与面包屑共用） */
export function getMenus(roleKey: string | null) {
  return routeToMenus(routes, createRoleChecker(roleKey))
}

/** 权限过滤后菜单树中自上而下第一个可跳转的叶子菜单（NavTab 兜底跳转用） */
export function getFirstLeafMenu(roleKey: string | null) {
  return firstLeafMenu(routeToMenus(routes, createRoleChecker(roleKey)))
}
