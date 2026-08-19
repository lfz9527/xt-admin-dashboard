# Task 3 报告

## 状态
已完成并提交。

## Commit
`97859b62db2e176ff10957ac9877574128e53d5c`

## 摘要
- 补齐用户详情与角色详情路由元数据；详情路由隐藏菜单并复用所属菜单键。
- 用户详情改为加载 `src/pages/system/users/detail.tsx`。
- 角色详情改为 `detail` 相对嵌套路由；用户和角色页面渲染 `<Outlet />`。
- `buildRouter(routes, checker = allowAllPermissions)` 递归过滤无权限路由，并保留有效布局及子路由。
- 新增 Task 3 路由行为测试，覆盖详情关联、嵌套路径和权限过滤。

## 测试实际结果
- `pnpm exec vitest run test/router/routes.test.tsx --reporter=dot`：通过，1 个测试文件、4 个测试通过。
- `pnpm exec tsc --noEmit`：通过，无输出。

## Concerns
- focused Vitest 输出仍包含现有 store 初始化日志；不影响测试结果。
- 工作区保留任务前已有的未跟踪设计/计划文档，未修改、未提交：
  - `docs/superpowers/plans/2026-08-19-route-menu-unification.md`
  - `docs/superpowers/specs/2026-08-19-route-menu-unification-design.md`

## Task 3 审查修复
- 将用户详情路由嵌套到 `/system/users` 下，使用相对路径 `:id`，由 `Users` 页面的 `<Outlet />` 承载。
- 更新路由测试，断言详情位于 `users.children` 且 path 为 `:id`，并保留详情元数据。
- 未修改 Task 4 文件，未提前接入路由菜单。

## 修复后测试实际结果
- `pnpm exec vitest run test/router/routes.test.tsx`：通过，1 个测试文件、4 个测试通过。
- `pnpm exec tsc --noEmit`：通过，无输出。
