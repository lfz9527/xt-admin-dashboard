export interface MenuItem {
  /** 唯一标识，与路由 meta.menuKey 关联以高亮当前菜单 */
  key: string
  /** 显示标题 */
  title: string
  /** 图标 */
  icon?: React.ReactNode
  /** 路由路径，叶子节点跳转，有 children 时为分组默认跳转 */
  path?: string
  /** 子菜单项，最多三层 */
  children?: MenuItem[]
}
