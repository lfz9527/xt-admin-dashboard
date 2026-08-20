# 导航标签与路由菜单联动设计

## 目标

让导航标签（NavTab）与路由、菜单自动联动：

- 路由变化时自动把当前页面加入标签；
- 标签标题与菜单/路由标题一致（来自路由 `meta.title`）；
- 点击标签跳转到对应路由；
- 关闭标签时激活相邻标签并跳转；
- 只剩下一个标签时标签不可关闭；
- 标签 `id` 使用路由路径。

## 现状

- `Tab` 只有 `id`、`title`、`closable`。
- `NavTabProvider` 只管理本地 state，没有任何调用方触发 `addTab`，运行时标签栏为空。
- 标签与路由、菜单没有联动。

## 设计

### 1. 标签标识

`Tab.id` 使用路由路径（`location.pathname`），同一路径只保留一个标签。

### 2. 路由同步组件

新增 `NavTabSync` 组件（`src/layout/NavTab/sync.tsx`），放在 `NavTabProvider` 内：

- 使用 `useLocation`、`useMatches` 获取当前路径和路由 `handle.title`；
- 路由变化时调用 `addTab({ id: pathname, title })` 并 `setActiveTab(pathname)`，`closable` 使用默认值 `true`；
- `addTab` 已按 id 去重，重复路由不会新增标签；
- 首次挂载也会为当前路由添加标签。

### 3. 点击标签跳转

`NavTab` 组件点击标签时使用 `useNavigate` 跳转到标签 `id` 对应路径，并同步激活状态。

### 4. 关闭标签行为

- 关闭非激活标签：直接移除。
- 关闭激活标签：移除后激活前一个标签，并跳转到其路由。
- 只剩下一个标签时不可关闭：沿用现有 `prev.length === 1` 保护，且关闭按钮仅在 `tabs.length > 1` 时显示。
- 所有标签 `closable` 默认 `true`，不做首页等固定逻辑。

### 5. 菜单与面包屑联动

标签标题来自路由 `meta.title`，与菜单标题、面包屑保持一致；菜单高亮继续由现有 `menuKey` 机制负责，不受标签影响。

## 边界与约束

- `NavTabProvider` 保持纯 context 实现，不依赖路由；路由逻辑集中在 `NavTabSync`。
- `NavTab` 使用路由导航，其测试需要包裹 `MemoryRouter`。
- 详情页等动态路径按各自 URL 生成标签。
- 不新增全局状态管理，不使用持久化。

## 验收标准

- 路由切换后标签自动出现，标题正确，当前标签激活。
- 点击标签跳转到对应路由并激活。
- 关闭激活标签后跳转到相邻标签路由。
- 只剩下一个标签时不可关闭。
- 菜单高亮与面包屑不受影响。
- 相关测试、TypeScript 检查和 lint 通过。
