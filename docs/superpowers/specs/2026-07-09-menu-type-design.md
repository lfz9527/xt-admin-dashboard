# 菜单类型设计

**日期**: 2026-07-09
**状态**: 设计完成

## 背景

当前 `src/components/Menu/menus.tsx` 中菜单数据为硬编码对象数组，无类型约束。项目需要一套类型化的菜单数据结构，与路由系统通过 `menuKey` 关联，支持三层嵌套，后续菜单通过接口动态生成。

## 设计

### 1. `MenuItem` 类型

新增文件 `src/components/Menu/types.ts`（文件已存在但为空）：

```typescript
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
```

**设计要点**：

- 统一类型覆盖三层结构：分组（有 `children` 的一级菜单）→ 可展开菜单（有 `children` 的二级菜单）→ 叶子菜单项（无 `children`）
- `key` 作为唯一标识，与路由 `meta.menuKey` 关联实现菜单高亮
- `icon` 使用 `React.ReactNode`，兼容组件和字符串，渲染方无需查表映射
- `path` 在叶子节点为跳转路径，在有 `children` 时作为分组默认跳转路径

### 2. `RouteMeta` 扩展

修改 `src/router/types.ts` 中的 `RouteMeta`：

```typescript
export type RouteMeta = RouteObject['handle'] & {
  /** 页面标题 */
  title?: string
  /** 环境列表 */
  env?: string[]
  /** 关联 MenuItem.key，用于菜单高亮 */
  menuKey?: string
}
```

新字段 `menuKey` 使路由与菜单项解耦，路径变更不影响菜单关联。

## 关联关系

```
MenuItem.key  ←→  RouteMeta.menuKey
   ↓                      ↓
菜单显示高亮          路由导航/匹配
```

- 当前路由匹配时，通过 `menuKey` 查找对应 `MenuItem` 并高亮
- 菜单项点击时，通过 `path` 跳转到对应路由

## 涉及文件

| 文件                           | 操作                            |
| ------------------------------ | ------------------------------- |
| `src/components/Menu/types.ts` | 新增 `MenuItem` 接口导出        |
| `src/components/Menu/index.ts` | 补充 `types.ts` 导出            |
| `src/router/types.ts`          | `RouteMeta` 新增 `menuKey` 字段 |

## 不在范围内

- `order` 排序字段（菜单顺序由接口数据决定）
- `hideInMenu` 隐藏控制（菜单数据由接口全量控制）
- `badge`、`disabled` 等交互状态（后续 B 方案再考虑）
- 菜单自动从路由生成逻辑（本设计仅定义类型）
