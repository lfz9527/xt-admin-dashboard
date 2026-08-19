# 最终 P1/P2 路由菜单修复报告

## 修复内容

- 将 `/dashboard/overview`、`/dashboard/analytics` 嵌套到 dashboard；将 users、roles 嵌套到 system，保留 URL 与详情相对嵌套路径。
- 为 dashboard、system、home 及原叶子菜单迁移图标到 route meta.icon。
- dashboard 页面补充 Outlet，保留父级页面可访问并渲染子路由。
- 静态角色详情使用路由标题“角色管理详情”，动态用户详情继续显示 ID。
- 更新真实路由、菜单、Header/面包屑测试，断言父子层级、图标、详情隐藏与标题。

## 实际验证命令输出

### `pnpm exec vitest run test/router/menu.test.ts test/router/routes.test.tsx test/components/useMenuBreadcrumb.test.ts test/components/Menu.test.tsx`

通过：4 个测试文件，26 个测试全部通过。

输出摘要：

```text
Test Files  4 passed (4)
Tests       26 passed (26)
```

测试期间仅有既有 `No HydrateFallback` 与 store/console 日志噪声。

### `pnpm exec tsc --noEmit`

通过，无输出。

### `pnpm lint`

通过：`$ eslint .`。

## 变更范围

本次提交仅包含路由、菜单、面包屑、页面 Outlet 及相关测试；未暂存用户已有 logo/public/docs 改动。

## Concerns

- 未运行全量测试；此前审查记录显示存在与本次无关的 Loading 测试失败和构建阶段既有问题。
- Header 中既有 breadcrumb console 日志未处理，避免扩大范围。


## P1 修复实际验证（2026-08-19）

- `src/pages/system/index.tsx` 渲染 `<Outlet />`，并在路由测试中断言用户/角色详情主体内容。
- `AppRouteObject` 使用 `Omit<RouteObject, 'children'>` 递归定义，避免子路由退化为 `RouteObject`；删除 `useMenuBreadcrumb` 未使用的 `isStaticDetail` 参数。
- 清理 `src/ui/Sidebar/context.tsx`、测试中的未使用导入。

### `pnpm exec vitest run test/router/menu.test.ts test/router/routes.test.tsx test/components/useMenuBreadcrumb.test.ts test/components/Menu.test.tsx`

通过：4 个测试文件，26 个测试全部通过。保留既有 `No HydrateFallback` 与 store/console 日志噪声。

### `pnpm exec tsc --noEmit`

通过，无输出。

### `pnpm lint`

通过：`$ eslint .`。

### `pnpm build`

通过：Vite production build 完成（8.85s）。存在既有 chunk size warning 与 `unplugin-icons` timing warning，不影响构建。

### Concerns

- 未修改用户已有 logo、`public/` 或用户 docs 文件；构建生成物未纳入提交。
