状态：已完成

commit hash：47917ad6aa6a21070c36a7182dacdf651d9bd582

修改摘要：
- 在 `src/pages/system/users/index.tsx` 增加“查询用户详情”按钮，点击后生成随机用户 ID 并导航至 `/system/users/:id`。
- 新增 `test/pages/system/users.test.tsx`，使用真实路由、固定 `Math.random` 并验证详情页渲染。

实际测试命令与结果：
- `pnpm exec vitest run test/pages/system/users.test.tsx --reporter=dot`：通过，1 个测试。
- `pnpm exec vitest run test/components/Menu.test.tsx test/router/routes.test.tsx --reporter=dot`：通过，7 个测试。
- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过。

Concerns：
- 测试输出包含既有的 `No HydrateFallback element provided` 警告，以及应用已有的调试日志；不影响测试结果。
- 工作区保留了任务开始前已存在、未由本任务创建的未跟踪文件：`docs/superpowers/plans/2026-08-19-user-detail-test-button.md` 和 `docs/superpowers/specs/2026-08-19-user-detail-test-button-design.md`，未纳入提交。
