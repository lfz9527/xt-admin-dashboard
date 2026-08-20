# Task 3 最终验证报告

## 状态
BLOCKED

本次仅执行验证与报告更新，未修改任何源码文件。

## 验证环境

- 工作目录：`E:\\lifangzheng-t\\xt-admin-dashboard`
- 当前分支：`lifangzheng/feat/auth_forms`
- 初始工作区：仅存在未跟踪文件 `docs/superpowers/plans/2026-08-20-login-auth-switch.md`

## 命令结果

### 1. 认证测试

命令：

```text
pnpm exec vitest run test/features/login.test.tsx test/router/routes.test.tsx
```

结果：通过。

- 测试文件：2 passed / 2
- 测试用例：12 passed / 12
- 认证测试和路由测试均通过
- 退出码：0

### 2. Lint

命令：

```text
pnpm lint
```

结果：通过。

- 执行内容：`eslint .`
- 退出码：0

### 3. Production build

命令：

```text
pnpm build
```

结果：失败。

失败发生在 TypeScript 检查阶段，尚未进入 Vite 构建阶段。错误集中在 `src/features/login/index.tsx`：

- 第 135、136 行：注册表单与忘记密码表单的联合类型传给 `renderField`，导致 `Control` 与字段名类型不兼容。
- 第 172 行：`isForgotPassword` 声明后未使用（TS6133）。
- 第 301、305 行：联合表单对象及联合 `handleSubmit` 与 `Form` / 注册提交处理函数的泛型不兼容。

退出码：2。

根因判断：该失败由当前分支引入。`git diff main...HEAD` 显示上述登录 Feature 的模式切换、注册/忘记密码联合表单及相关渲染逻辑均为当前分支改动；错误位置也全部位于当前分支修改的 `src/features/login/index.tsx`。这不是已知基线失败。

### 4. 认证残留引用检查

命令：

```text
git grep -n -E "(/register|/forgot-password|features/register|features/forgot-password|pages/register|pages/forgot-password)" -- ':!docs/*'
```

结果：失败，发现残留引用：

```text
test/router/routes.test.tsx:56:      findRoute(routes, (route) => route.path === '/forgot-password')
```

该命中来自测试中用于断言“没有独立忘记密码路由”的字符串，不是生产路由、导入、链接或已删除文件引用；但按 brief 要求的字面残留检查，命令并非零命中。

此外，`.superpowers/sdd/task-3-report.md` 中存在历史报告文字命中，但该文件不在 `-- ':!docs/*'` 排除范围内；本报告已覆盖该历史内容。

### 5. 工作区与变更统计

命令：

```text
git status --short && git diff main...HEAD --stat
```

结果：

工作区未跟踪文件：

```text
?? docs/superpowers/plans/2026-08-20-login-auth-switch.md
```

相对 `main...HEAD` 的变更统计：

```text
.superpowers/sdd/task-3-report.md                  |  49 +++
docs/superpowers/plans/2026-08-20-auth-forms.md    | 333 +++++++++++++++++++
.../specs/2026-08-20-auth-forms-design.md          |  44 +++
src/features/login/index.tsx                       | 359 +++++++++++++++------
test/features/login.test.tsx                       |  31 ++
test/router/routes.test.tsx                        |  10 +-
6 files changed, 730 insertions(+), 96 deletions(-)
```

## 既有基线失败说明

当前未发现可归因于主分支基线的失败。认证测试和 lint 均通过；build 的 TypeScript 错误明确位于当前分支新增/修改的登录认证模式切换代码中，因此应视为本分支问题。

仓库中此前已有的报告内容曾记录旧的独立 `/register`、`/forgot-password` 路由和相关页面，但当前 `git diff main...HEAD` 未显示这些页面或路由文件属于当前分支变更；本次残留检查的实际生产代码未发现独立认证路由。历史报告文字本身会造成 grep 命中，属于报告文件内容问题而非源码引用。

## Concerns

1. `pnpm build` 当前阻塞，必须先解决 `src/features/login/index.tsx` 的联合表单泛型类型错误和未使用变量问题；本次按要求未擅自修复。
2. 残留引用检查按字面未通过，因为 `test/router/routes.test.tsx` 需要包含 `/forgot-password` 字符串来验证该路由不存在。该命中不是运行时路由暴露，但与 brief 的“无命中”预期冲突。
3. 工作区存在未跟踪计划文件 `docs/superpowers/plans/2026-08-20-login-auth-switch.md`；它未计入 `git diff main...HEAD --stat`，需由上游决定是否保留。
4. 当前分支统计包含认证表单、测试、设计/计划文档及本报告改动；未观察到后台业务目录改动。

## Task 3 修复报告（2026-08-20）

### 修复内容

- 修复 `src/features/login/index.tsx` 的联合表单泛型根因：注册和忘记密码模式分别渲染各自的 `Form`、`handleSubmit`、字段集合和提交处理器。
- `renderField` 使用 `FieldValues`、`Path<T>` 与 `UseFormReturn<T>` 泛型，保证字段名和表单 control 类型安全；未使用 `any`，未关闭 TypeScript 检查。
- 移除未使用的 `isForgotPassword`，保持登录、注册、忘记密码的本地模式切换和现有提交行为不变。
- 将计划文件 `docs/superpowers/plans/2026-08-20-login-auth-switch.md` 纳入提交。
- 保留 `test/router/routes.test.tsx` 中用于断言独立 `/register` 与 `/forgot-password` 路由不存在的测试；生产源码残留检查单独排除 `test/`、`.superpowers/`、`docs/`。

### 验证命令及结果

1. `pnpm exec vitest run test/features/login.test.tsx test/router/routes.test.tsx`：通过，2 个测试文件、12 个测试用例全部通过。
2. `pnpm lint`：通过，`eslint .` 退出码 0。
3. `pnpm build`：通过，TypeScript 检查和 Vite 生产构建均完成；仅保留既有 chunk size warning。
4. `git grep -n -E "(/register|/forgot-password|features/register|features/forgot-password|pages/register|pages/forgot-password)" -- ':!test/*' ':!.superpowers/*' ':!docs/*' || true`：无输出，生产代码无独立认证路由引用。命令使用 `|| true` 仅避免无命中时退出码为 1，不改变检查结果。

### 提交

- Commit hash：待提交后填入。

### Concerns

- Vite 构建输出提示存在大于 500 kB 的 chunk；这是既有构建警告，本次未改变构建拆分策略。
