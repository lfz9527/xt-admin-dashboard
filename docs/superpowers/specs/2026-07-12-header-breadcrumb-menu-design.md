# Header 面包屑 — 菜单数据驱动

## 目标

Header 组件中面包屑由目前的硬编码静态数据，改为根据当前路由 + 菜单树动态生成。

## 数据流

```
useMatches() → 当前路由 handle.menuKey + handle.title
useMenu()    → 菜单树 MenuItem[]
    ↓
useMenuBreadcrumb(menus, menuKey, fallbackTitle)
    ↓
   DFS 在菜单树中查找 menuKey 对应的节点，记录完整祖先路径
    ↓
   路径节点映射为 BreadcrumbItemData[]:
   [
     { label: '系统管理', href: '/system' },
     { label: '角色管理', href: '/system/roles' },
     { label: '三级菜单' }                    // 末节点，不可点击
   ]
    ↓
useBreadcrumbCollapse(items, maxItems, ...)  → 折叠后的 BreadcrumbItemData[]
    ↓
<Breadcrumb items={...} />
```

## 新增文件

### `src/components/Breadcrumb/useMenuBreadcrumb.ts`

**输入**:

- `menus: MenuItem[]` — 菜单树，从 `useMenu()` 获取
- `menuKey: string` — 当前路由的 `handle.menuKey`
- `fallbackTitle?: string` — 路由 `handle.title`，菜单中找不到时的兜底

**输出**: `BreadcrumbItemData[]`

**逻辑**:

1. 在菜单树中执行 DFS，查找 `key === menuKey` 的节点
2. 找到后，收集从根到该节点的完整路径（不包括根之前的分支）
3. 路径上每个祖先映射为 `{ label, href: path }`，末节点映射为 `{ label }`（无 href，渲染为当前页文本）
4. 路径中某节点无 `path` 字段时，该项不渲染为链接
5. 未找到匹配节点时，退回 `[{ label: fallbackTitle ?? '' }]`

**缓存**: `useMemo`，依赖 `[menus, menuKey, fallbackTitle]`

## 修改文件

### `src/components/Header/index.tsx`

- 删除硬编码的 `items` 数组（当前第 24-32 行）
- 从 `useMatches()` 获取 `menuKey` 和 `title`
- 从 `useMenu()` 获取 `menus`
- 调用 `useMenuBreadcrumb(menus, menuKey, title)`
- 将返回值传给 `<Breadcrumb items={...} />`
- 保留 `maxItems`、`startCount`、`endCount` 等折叠配置

## 边界情况

| 场景                            | 行为                                           |
| ------------------------------- | ---------------------------------------------- |
| 路由有 menuKey 且菜单树中存在   | 完整面包屑路径，祖先可点击                     |
| 路由有 menuKey 但菜单树中不存在 | 退回 `[{ label: fallbackTitle }]` 纯文本       |
| 路由无 menuKey（login、404 等） | `[{ label: fallbackTitle }]` 纯文本            |
| 菜单节点无 path 字段            | 该项不渲染为链接，仅显示 label 文本            |
| 移动端                          | `useIsMobile()` 当前已处理，面包屑隐藏，无改动 |

## 不变更

- `Breadcrumb` 组件本身 — 接口不变
- `useBreadcrumbCollapse` — 职责不变，继续处理折叠逻辑
- `useMenu` store — 菜单数据源不变
- 路由定义 — 路由 `meta.menuKey` 机制不变
