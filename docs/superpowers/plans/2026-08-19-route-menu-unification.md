# 路由与菜单统一配置实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以路由配置作为唯一导航源，自动生成菜单和面包屑，并预留可同时过滤路由与菜单的权限能力。

**Architecture:** 扩展 `RouteMeta` 承载菜单和权限元数据；新增纯函数将路由树转换为菜单树，并通过同一个权限判断函数过滤路由和菜单。详情路由嵌套在列表路由下，由列表页的 `<Outlet />` 渲染，详情路由复用所属菜单 `menuKey` 但不显示为侧边菜单项。

**Tech Stack:** React 19、TypeScript、React Router、Zustand、Vitest、Testing Library。

## Global Constraints

- 路由配置是菜单、面包屑和页面关联信息的唯一来源。
- 父级和子级权限都必须校验；父级无权限时，子级不可单独显示。
- 菜单数据不得作为独立菜单树持久化到 `localStorage`。
- 暂不绑定具体后端权限接口；默认权限判断允许现有页面访问。
- 只修改与路由、菜单、面包屑和详情嵌套相关的代码，不重构无关组件。
- 完成后运行相关 Vitest、`pnpm lint` 和 `pnpm build`。

---

### Task 1: 建立路由元数据与权限过滤接口

**Files:**

- Modify: `src/router/types.ts:3-22`
- Create: `src/router/permissions.ts`
- Test: `test/router/permissions.test.ts`

**Interfaces:**

- `RouteMeta` 新增 `icon?: string`、`showInMenu?: boolean`、`permission?: string | string[]`。
- `PermissionChecker` 类型为 `(permission: string | string[] | undefined) => boolean`。
- 导出 `allowAllPermissions: PermissionChecker`，当前始终返回 `true`。
- 导出 `hasRoutePermission(meta: RouteMeta | undefined, checker: PermissionChecker): boolean`，无 permission 时允许访问，有 permission 时委托给 checker。

- [ ] **Step 1: Write the failing tests**

在 `test/router/permissions.test.ts` 覆盖：无 permission 允许访问、单个 permission 委托 checker、permission 数组委托 checker、`allowAllPermissions` 允许现有路由。

```ts
it('无权限声明时允许访问', () => {
  expect(hasRoutePermission({ title: '首页' }, () => false)).toBe(true)
})

it('声明权限时交给权限检查器', () => {
  const checker = vi.fn(() => false)
  expect(hasRoutePermission({ permission: 'system:users:view' }, checker)).toBe(
    false
  )
  expect(checker).toHaveBeenCalledWith('system:users:view')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test -- test/router/permissions.test.ts`

Expected: FAIL because `permissions.ts` and the new metadata fields do not exist.

- [ ] **Step 3: Implement the minimal permission interface**

在 `src/router/types.ts` 扩展 `RouteMeta`，在 `src/router/permissions.ts` 实现 `PermissionChecker`、`allowAllPermissions` 和 `hasRoutePermission`。不要引入后端请求或角色判断。

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm test -- test/router/permissions.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/router/types.ts src/router/permissions.ts test/router/permissions.test.ts
git commit -m "feat: add route permission metadata interface

- Extend route metadata for menu visibility and permission declarations
- Provide a replaceable permission checker for future backend integration
- Keep current routes accessible with the default allow-all checker"
```

### Task 2: 从路由树派生并过滤菜单树

**Files:**

- Create: `src/router/menu.ts`
- Modify: `src/components/Menu/types.ts:1-15`
- Test: `test/router/menu.test.ts`

**Interfaces:**

- 导出 `routeToMenus(routes: AppRouteObject[], checker?: PermissionChecker): MenuItem[]`。
- `MenuItem` 保持 `key`、`title`、`icon`、`path`、`children` 字段；菜单节点必须来自路由 `meta`。
- `showInMenu === false` 的详情路由不产生菜单节点，但其可见子路由仍需递归处理。
- 目录节点只有在自身权限通过且存在可见子菜单时才保留；无子级的可见路由生成叶子菜单。
- 使用 `joinRoutePath(parentPath, route.path)` 处理相对路径和绝对路径，避免生成重复 URL。

- [ ] **Step 1: Write failing tests**

覆盖以下输入：叶子路由生成菜单、嵌套路由生成目录、详情路由不显示、父级无权限时子级不显示、父级通过但所有子级无权限时不生成空目录、路由元数据缺少 `menuKey` 或 `title` 时不生成菜单项。

```ts
it('详情路由不出现在菜单但保留可见目录', () => {
  const menus = routeToMenus([
    {
      path: '/system/users',
      meta: { title: '用户管理', menuKey: 'system-users' },
      children: [
        {
          path: ':id',
          meta: {
            title: '用户详情',
            menuKey: 'system-users',
            showInMenu: false,
          },
        },
      ],
    },
  ])

  expect(menus).toEqual([
    { key: 'system-users', title: '用户管理', path: '/system/users' },
  ])
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test -- test/router/menu.test.ts`

Expected: FAIL because `routeToMenus` does not exist.

- [ ] **Step 3: Implement the pure route-to-menu converter**

在 `src/router/menu.ts` 递归处理 `AppRouteObject[]`。仅使用路由 `meta` 和 `path` 生成 `MenuItem`，不读取 Zustand，不读取 `localStorage`。权限判断必须先作用于当前节点，再决定是否递归保留子节点；调用默认 `allowAllPermissions` 时保持现有菜单全部可见。

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm test -- test/router/menu.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/router/menu.ts src/components/Menu/types.ts test/router/menu.test.ts
git commit -m "feat: derive menus from route metadata

- Build nested menu items directly from the route tree
- Filter menu nodes with the shared permission checker
- Exclude hidden detail routes without creating empty parent menus"
```

### Task 3: 将路由配置改为唯一菜单源并修正详情层级

**Files:**

- Modify: `src/router/routes.tsx:6-80`
- Modify: `src/router/utils/index.ts:6-35`
- Modify: `src/pages/system/users/index.tsx`
- Modify: `src/pages/system/roles/index.tsx`
- Modify: `src/pages/system/users/detail.tsx`
- Test: `test/router/routes.test.tsx`

**Interfaces:**

- `routes.tsx` 中所有菜单节点路由声明 `meta.title`、`meta.menuKey`，需要图标时声明 `meta.icon`。
- 详情路由声明 `showInMenu: false`，并复用所属菜单的 `menuKey`。
- `/system/users/:id` 加载 `@/pages/system/users/detail`。
- `/system/roles/detail` 改为父路由下的相对路径 `detail`，详情由 `/system/roles` 页面中的 `<Outlet />` 替换列表内容。
- `buildRouter` 接收可选 `PermissionChecker`，默认使用 `allowAllPermissions`，过滤无权限路由并递归保留合法子路由。

- [ ] **Step 1: Write failing route behavior tests**

测试路由元数据：用户详情使用详情组件关联信息、详情路由隐藏菜单但复用 `system-users`、角色详情是相对嵌套路由、`buildRouter` 使用 checker 过滤无权限路由。

```ts
it('无权限路由不会进入构建结果', () => {
  const result = buildRouter(
    [
      { path: '/public', element: null, meta: { title: '公开页' } },
      {
        path: '/admin',
        element: null,
        meta: { title: '管理页', permission: 'admin:view' },
      },
    ],
    () => false
  )

  expect(result.map((route) => route.path)).toEqual(['/public'])
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test -- test/router/routes.test.tsx`

Expected: FAIL because `buildRouter` currently没有权限参数和路由过滤，且详情路由配置仍不符合目标。

- [ ] **Step 3: Implement route metadata and nested detail pages**

修改路由配置：补充 dashboard、system、详情路由的统一元数据；将用户详情指向 `detail.tsx`；将角色详情 path 改为 `detail`。在 users 和 roles 列表页面返回 `<Outlet />`，确保父路由匹配时详情内容能替换列表内容。

- [ ] **Step 4: Implement permission-aware `buildRouter`**

将 `buildRouter(routes, checker = allowAllPermissions)` 递归过滤路由。只过滤声明了 permission 且检查失败的路由；布局路由和无 permission 路由继续保留。过滤后没有合法子路由的非页面目录路由不应留下空 children。

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `pnpm test -- test/router/routes.test.tsx`

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/router/routes.tsx src/router/utils/index.ts src/pages/system/users/index.tsx src/pages/system/roles/index.tsx src/pages/system/users/detail.tsx test/router/routes.test.tsx
git commit -m "fix: align nested detail routes with navigation metadata

- Associate user and role detail routes with their parent menu keys
- Render detail pages through the parent route Outlet
- Filter inaccessible routes while preserving the existing route tree"
```

### Task 4: 使用派生菜单并移除菜单树持久化

**Files:**

- Modify: `src/store/useMenu.ts:1-87`
- Modify: `src/components/Menu/menus.tsx:133-154`
- Modify: `src/layout/baseLayout.tsx:1-30`
- Test: `test/components/Menu.test.tsx`

**Interfaces:**

- `useMenu` 只保留侧边栏开关状态和操作，不再保存 `menus`。
- `Menus` 使用 `useMatches()` 获取当前路由匹配，再从统一路由配置调用 `routeToMenus(routes)`；权限 checker 通过明确的依赖入口传入，当前默认 `allowAllPermissions`。
- 侧边栏渲染仍使用现有 `Tree`，只替换菜单数据来源，不改变视觉样式和展开行为。
- `app-menu` 持久化配置删除；若保留 store persist，只持久化 `sidebarOpen`，不得持久化 `menus`。

- [ ] **Step 1: Write failing component/store tests**

覆盖：菜单数据由路由配置生成、详情路由不显示、侧边栏 store 初始化不包含 `menus` 持久化字段、现有 dashboard/system/roles 层级仍正常渲染。

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test -- test/components/Menu.test.tsx`

Expected: FAIL because `Menus` 仍从 `useMenu` 读取 `menus`。

- [ ] **Step 3: Implement the smallest integration change**

移除 `mockMenus`、`menus` 状态和调试日志；将派生菜单放在路由配置消费层。仅让 `sidebarOpen` 继续经过 Zustand persist，菜单数组每次根据当前路由配置和权限上下文计算。

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `pnpm test -- test/components/Menu.test.tsx test/components/useMenuBreadcrumb.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/store/useMenu.ts src/components/Menu/menus.tsx src/layout/baseLayout.tsx test/components/Menu.test.tsx
git commit -m "refactor: derive sidebar menus from routes

- Remove duplicated mock menu state from the menu store
- Keep only sidebar presentation state in persisted storage
- Render navigation from the filtered route configuration"
```

### Task 5: 统一面包屑数据源并完成回归验证

**Files:**

- Modify: `src/components/Breadcrumb/useMenuBreadcrumb.ts:1-127`
- Modify: `src/components/Header/index.tsx:1-60`
- Modify: `test/components/useMenuBreadcrumb.test.ts:1-154`

**Interfaces:**

- `useMenuBreadcrumb` 接收 `MenuItem[]` 的接口保持兼容，但调用方必须传入 `routeToMenus` 的结果。
- 路由已有 `handle.menuKey` 时优先使用它；动态详情路径不再依赖缺失 `menuKey` 的猜测逻辑，但保留 pathname fallback 以兼容 404 和外部直达页面。
- 没有父级 path 时，面包屑祖先 `href` 保持 `undefined`，不得回退到首页。

- [ ] **Step 1: Update failing/coverage tests**

增加统一派生菜单下的用户详情和角色详情面包屑断言；验证详情页显示动态段，列表菜单项可回退，父级无 path 时不生成错误首页链接。

```ts
it('用户详情使用所属菜单生成面包屑', () => {
  const { result } = renderHook(() =>
    useMenuBreadcrumb(
      [{ key: 'system-users', title: '用户管理', path: '/system/users' }],
      'system-users',
      undefined,
      '/system/users/123'
    )
  )

  expect(result.current).toEqual([
    { label: '用户管理', href: '/system/users' },
    { label: '123', href: undefined },
  ])
})
```

- [ ] **Step 2: Run the focused tests and verify the expected gap**

Run: `pnpm test -- test/components/useMenuBreadcrumb.test.ts`

Expected: 新增断言在调用方仍传入旧 `mockMenus` 或旧菜单配置时失败，暴露统一数据源接入缺口。

- [ ] **Step 3: Connect Header to derived menus**

让 Header 与 Menus 使用同一个 `routeToMenus(routes)` 结果；保留当前 404 标题处理和动态段追加逻辑，不额外改写 breadcrumb 算法。

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `pnpm test -- test/components/useMenuBreadcrumb.test.ts test/components/Menu.test.tsx`

Expected: PASS。

- [ ] **Step 5: Run full verification**

Run: `pnpm test`

Expected: 全部测试通过。

Run: `pnpm lint`

Expected: ESLint 无错误。

Run: `pnpm build`

Expected: TypeScript 检查和 Vite 生产构建成功。

- [ ] **Step 6: Commit**

```bash
git add src/components/Breadcrumb/useMenuBreadcrumb.ts src/components/Header/index.tsx test/components/useMenuBreadcrumb.test.ts
 git commit -m "test: verify unified route menu navigation

- Cover detail breadcrumbs and dynamic route segments
- Reuse derived menus for header breadcrumbs and sidebar navigation
- Validate the complete route filtering and menu rendering flow"
```
