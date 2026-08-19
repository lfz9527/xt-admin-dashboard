状态：DONE

提交 hash：16a7dc9952275b9a8068f667530d6b613e0de9e8

修改摘要：
- 扩展 `RouteMeta`，新增 `icon`、`showInMenu`、`permission` 元数据字段。
- 新增 `PermissionChecker`、`allowAllPermissions` 和 `hasRoutePermission`。
- 新增路由权限接口 Vitest 测试，覆盖无权限、单权限、权限数组和默认放行场景。

测试命令及实际结果：
- `pnpm test -- test/router/permissions.test.ts`：命令因项目脚本将参数转发异常，运行了全量测试并失败（既有 `test/components/Loading.test.tsx` 失败等）。
- `pnpm exec vitest run test/router/permissions.test.ts`：通过，1 个测试文件、4 个测试全部通过。
- `pnpm exec tsc --noEmit`：通过，无输出。

疑问：无。

Concerns：工作区原有未跟踪文件 `docs/superpowers/plans/2026-08-19-route-menu-unification.md` 和 `docs/superpowers/specs/2026-08-19-route-menu-unification-design.md` 未修改、未提交。

## Task 1 审查修复报告

状态：待提交

修复摘要：
- 将 `hasRoutePermission` 的未声明判断收紧为仅 `permission === undefined`，避免空字符串或空数组绕过权限检查器。
- 为 `allowAllPermissions` 测试补充真实权限声明 `dashboard:view`，确保测试实际经过权限检查器。

测试命令及实际结果：
- `pnpm exec vitest run test/router/permissions.test.ts`

```text
 RUN  v4.1.10 E:/lifangzheng-t/xt-admin-dashboard

 ✓ test/router/permissions.test.ts (4 tests) 5ms

 Test Files  1 passed (1)
 Tests  4 passed (4)
 Start at  16:00:37
 Duration  1.33s (transform 31ms, setup 116ms, import 47ms, tests 5ms, environment 951ms)
```

- `pnpm exec tsc --noEmit`

```text
命令通过，无输出。
```