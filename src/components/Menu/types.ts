export interface MenuItemData {
  /** 唯一标识，与路由 meta.menuKey 关联以高亮当前菜单 */
  key: string
  /** 显示标题 */
  title: string
  /** 图标标识（lucide 图标名），组件层映射为 JSX */
  icon?: string
  /** 路由路径，叶子节点跳转 */
  path?: string
  /** 子菜单项 */
  children?: MenuItemData[]
}

/** MenuItem 是组件层的 MenuItemData 渲染引用 */
export type { MenuItemData as MenuItem }
