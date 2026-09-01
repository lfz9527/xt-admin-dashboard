# 用户/角色管理批量删除 实施计划

## 目标

在用户管理、角色管理两页启用 DataTable 多选下的批量删除：勾选多行 → 批量删除按钮 → 确认弹窗 → 调用后端批量删除接口 → 刷新列表并清理选中状态。

## 现状（已核实）

- `src/components/DataTable` 已支持多选（`selectable` + `rowSelection`/`onRowSelectionChange`），角色管理页已启用并展示「已选 N 项」，评论注明"供后续批量操作使用"；用户管理页尚未启用。
- 后端 `nest-practices` 已实现 `POST /users/delete/batch`（`{ ids: number[] }`，≤50 条）与 `POST /roles/delete/batch`（`{ ids: number[] }`，≤50 条），前端 service 层尚未封装。
- 单行删除已由 `DeleteRoleDialog` / `DeleteUserDialog`（AlertDialog + `deleteRole`/`deleteUser`）实现；无"confirm 对话框"抽象，直接组合 AlertDialog 原语。

## 改动清单（最小范围）

1. `src/service/roles.ts`：新增 `deleteRoles(ids: number[])` → `POST /roles/delete/batch`。
2. `src/service/users.ts`：新增 `deleteUsers(ids: number[])` → `POST /users/delete/batch`。
3. `src/features/role/components/DeleteRoleDialog.tsx`：改为支持批量——props 由 `role: RoleItem | null` 调整为 `roles: RoleItem[]`（单删传 `[role]`），批量调 `deleteRoles`，描述文案区分单/批量。
4. `src/features/user/components/DeleteUserDialog.tsx`：同上（调 `deleteUsers`）。
5. `src/pages/system/roles/index.tsx`：toolRender 增加「批量删除」按钮（仅 `selectedCount > 0` 时显示），将选中行 id 映射为角色对象数组传给对话框；删除成功清空 `rowSelection` 并刷新。
6. `src/pages/system/users/index.tsx`：启用 `selectable` + `rowSelection` 受控状态 + 批量删除按钮 + 对话框接入。
7. 测试补充：
   - `test/pages/system/roles.test.tsx`：批量删除用例（勾选→弹窗文案→`deleteRoles([1,2])`→刷新→选中清空）。
   - `test/pages/system/users.test.tsx`：多选与批量删除用例。
   - 同步更新 service mock 新增函数，避免既有用例破坏。

## 验证

- 运行 `test/pages/system/roles.test.tsx`、`test/pages/system/users.test.tsx`。
- `pnpm lint`、`pnpm compile`。

## 不做的事

- 不新增全局「批量删除」抽象组件（与现有单删 AlertDialog 组合方式保持一致）。
- 不改动 DataTable 组件本身（多选能力已就绪）。
- 不改后端（接口已存在且单次 ≤50 条）。
