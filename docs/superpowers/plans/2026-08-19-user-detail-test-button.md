# 用户详情测试按钮实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在用户管理页增加一个按钮，点击后生成随机数字 ID 并跳转用户详情页。

**Architecture:** 用户管理页面使用 React Router 的 `useNavigate` 执行导航，按钮点击时在页面内生成随机 ID。测试通过 MemoryRouter 验证点击后的 URL 和详情页面渲染，不引入接口、全局状态或用户列表。

**Tech Stack:** React 19、TypeScript、React Router、Vitest、Testing Library。

## Global Constraints

- 按钮文案固定为“查询用户详情”。
- 点击后跳转到 `/system/users/<随机数字>`。
- 随机 ID 使用 `Math.floor(Math.random() * 1000000)`。
- 不新增接口、全局状态、持久化数据或用户列表。
- 保留现有用户详情路由、菜单高亮和面包屑行为。
- 不覆盖用户已有未提交修改。

---

### Task 1: 添加用户详情测试按钮

**Files:**

- Modify: `src/pages/system/users/index.tsx:1-11`
- Modify: `test/components/Menu.test.tsx` 或新建 `test/pages/system/users.test.tsx`

**Interfaces:**

- `Users` 页面使用 `useNavigate(): NavigateFunction`。
- 点击处理函数生成 `const id = Math.floor(Math.random() * 1000000)`，调用 `navigate(`/system/users/${id}`)`。
- 页面继续渲染现有 `users` 文本和 `<Outlet />`。

- [ ] **Step 1: Write the failing test**

在用户页面测试中使用 `createMemoryRouter` 和真实路由，固定 `Math.random` 返回值，点击按钮并断言详情页内容与数字 ID：

```tsx
it('点击查询用户详情按钮后跳转到随机用户详情', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.123456)
  const router = createMemoryRouter(buildRouter(routes), {
    initialEntries: ['/system/users'],
  })

  render(<RouterProvider router={router} />)

  await userEvent.click(
    await screen.findByRole('button', { name: '查询用户详情' })
  )

  expect(router.state.location.pathname).toBe('/system/users/123456')
  expect(await screen.findByText('user detail')).toBeInTheDocument()
})
```

测试结束时恢复 spy，避免影响其他测试：

```tsx
afterEach(() => vi.restoreAllMocks())
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/pages/system/users.test.tsx --reporter=dot`

Expected: FAIL because the button is not present.

- [ ] **Step 3: Implement minimal page behavior**

在 `src/pages/system/users/index.tsx` 中添加：

```tsx
import { Outlet, useNavigate } from 'react-router'

export default function Users() {
  const navigate = useNavigate()

  return (
    <>
      users
      <button
        type='button'
        onClick={() => {
          const id = Math.floor(Math.random() * 1000000)
          navigate(`/system/users/${id}`)
        }}
      >
        查询用户详情
      </button>
      <Outlet />
    </>
  )
}
```

只添加测试所需按钮，不新增抽象、数据请求或列表结构。

- [ ] **Step 4: Run focused test to verify it passes**

Run: `pnpm exec vitest run test/pages/system/users.test.tsx --reporter=dot`

Expected: PASS。

- [ ] **Step 5: Run related regression tests**

Run: `pnpm exec vitest run test/components/Menu.test.tsx test/router/routes.test.tsx --reporter=dot`

Expected: PASS，用户详情菜单高亮、面包屑和嵌套路由不回归。

- [ ] **Step 6: Run TypeScript and lint checks**

Run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: 两项均通过。

- [ ] **Step 7: Commit**

```bash
git add src/pages/system/users/index.tsx test/pages/system/users.test.tsx
git commit -m "feat: 添加用户详情测试按钮

- 在用户管理页生成随机用户 ID
- 通过详情路由验证用户详情跳转链路
- 增加按钮点击与详情渲染测试"
```
