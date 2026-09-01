# 验证证据（VERIFY）

- 时间：2026-09-01
- 基线：2c7ea69 (main)

## 验收标准对照

| 验收标准                                     | 结果                                                |
| -------------------------------------------- | --------------------------------------------------- |
| 用户管理页支持表格多选并可一键批量删除       | ✅ selectable + rowSelection + 批量删除按钮         |
| 角色管理页接入批量删除                       | ✅ 批量删除按钮 + 弹窗确认                          |
| 批量删除成功按整页刷新并清空选中             | ✅ onSuccess 清理 rowSelection + run()              |
| 删除按钮仅在选中行时可用；超 50 条禁用并提示 | ✅ selectedCount > 50 禁用 + 「单次最多删除 50 条」 |
| 相关测试、lint、compile 通过                 | ✅ 见下                                             |

## 测试结果

- `pnpm exec vitest run test/pages/system/roles.test.tsx test/pages/system/users.test.tsx`
  → 2 files passed, 27 tests passed（新增批量删除成功/失败用例 4 个）
- `pnpm lint` → 通过（无输出）
- `pnpm compile`（tsc -b）→ 通过（无输出）

## 改动文件

- src/service/roles.ts、src/service/users.ts：新增 deleteRoles/deleteUsers（POST /roles/delete/batch、/users/delete/batch）
- src/features/role/components/DeleteRoleDialog.tsx、src/features/user/components/DeleteUserDialog.tsx：支持批量（ids + names）
- src/pages/system/roles/index.tsx、src/pages/system/users/index.tsx：批量删除按钮 + 50 条上限防呆 + 选中清理
- test/pages/system/roles.test.tsx、test/pages/system/users.test.tsx：批量删除用例
