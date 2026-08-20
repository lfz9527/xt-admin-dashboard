# 登录页内认证表单切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将注册和忘记密码表单收归登录 Feature，在同一个登录页面内通过本地状态切换，且不发生认证表单间的路由跳转。

**Architecture:** `src/features/login/index.tsx` 统一维护 `login | register | forgot-password` 三种展示模式，并在同一 Card 布局内按模式渲染对应 schema、字段和提交逻辑。删除独立注册/忘记密码 Feature、页面包装和路由；登录成功仍按原逻辑跳转首页，注册或密码重置成功后仅 Toast 并切回登录模式。

**Tech Stack:** React 19、TypeScript、React Router（仅保留登录成功后的首页导航）、react-hook-form、zod、Vitest、Testing Library。

## Global Constraints

- 注册和忘记密码属于 `src/features/login`，表单切换只更新本地状态，不调用 `navigate`。
- 验证码只校验非空，不发送真实请求，不增加验证码按钮或倒计时。
- 注册字段固定为邮箱、用户名、验证码、密码、确认密码。
- 忘记密码字段固定为邮箱、验证码、新密码、确认密码。
- 注册成功提示“注册成功”，密码重置成功提示“密码重置成功”，两者随后切回登录表单。
- 登录成功后的 `navigate('/', { replace: true })` 行为保持不变。
- 删除 `/register`、`/forgot-password` 路由及其页面和独立 Feature 文件。
- 不接入服务端请求、认证状态、密码持久化或额外路由守卫。
- 修改行为后运行相关测试、`pnpm lint` 和 `pnpm build`。

---

### Task 1: 将注册与忘记密码逻辑迁入 LoginFeature

**Files:**

- Modify: `src/features/login/index.tsx`
- Test: `test/features/login.test.tsx`

**Interfaces:**

- `LoginFeature` 内部使用本地 `mode` 状态，初始值为 `'login'`。
- 登录模式展示现有账号、密码、记住账号密码字段。
- 注册模式展示邮箱、用户名、验证码、密码、确认密码字段。
- 忘记密码模式展示邮箱、验证码、新密码、确认密码字段。

- [ ] **Step 1: Add failing same-page switching tests**

在 `test/features/login.test.tsx` 增加测试，验证入口切换不调用导航且显示目标表单：

```tsx
it('switches to registration without navigating', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <LoginFeature />
    </MemoryRouter>
  )

  await user.click(screen.getByRole('button', { name: '注册账号' }))

  expect(screen.getByText('注册管理后台')).toBeInTheDocument()
  expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
  expect(navigate).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: '返回登录' })).toBeInTheDocument()
})

it('switches to password recovery without navigating', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <LoginFeature />
    </MemoryRouter>
  )

  await user.click(screen.getByRole('button', { name: '忘记密码' }))

  expect(screen.getByText('忘记密码')).toBeInTheDocument()
  expect(screen.getByLabelText('新密码')).toBeInTheDocument()
  expect(navigate).not.toHaveBeenCalled()
})
```

将原来断言 `/register` 和 `/forgot-password` href 的测试改为断言这两个入口是按钮，并且不产生导航。

- [ ] **Step 2: Run the focused login tests to verify failure**

Run: `pnpm exec vitest run test/features/login.test.tsx`

Expected: FAIL because the current links navigate to separate routes and LoginFeature does not render registration or recovery forms.

- [ ] **Step 3: Implement the unified local-mode form**

在 `src/features/login/index.tsx` 中：

1. 将 `Link` 替换为本地交互所需的按钮或 `type='button'` 控件，并新增 `useState` 导入。
2. 将注册和忘记密码的 Zod schema、字段定义和表单渲染逻辑迁入该文件；为每种模式使用独立 `useForm`，避免切换时字段类型和校验状态互相污染。
3. 用 `mode` 状态控制标题、描述、字段和提交按钮：
   - `login`：保持现有登录 UI 和提交逻辑。
   - `register`：邮箱、用户名、验证码、密码、确认密码；密码不一致提示“两次输入的密码不一致”。
   - `forgot-password`：邮箱、验证码、新密码、确认密码；密码不一致提示“两次输入的密码不一致”。
4. 注册或重置提交等待 `1200ms`，显示对应成功 Toast，然后 `setMode('login')`，不调用 `navigate`。
5. 注册和重置模式提供“返回登录”按钮，调用 `setMode('login')`。
6. 保留登录模式已有 `useNavigate`、凭据加载、记住账号密码和成功后跳转首页逻辑。
7. 复用现有 Logo、Card、Input、Spinner、Toast、Form 组件，保持现有布局和文案风格。

- [ ] **Step 4: Run focused tests to verify pass**

Run: `pnpm exec vitest run test/features/login.test.tsx`

Expected: PASS，包含原登录测试和新增的单页切换测试。

- [ ] **Step 5: Commit the unified LoginFeature**

```bash
git add src/features/login/index.tsx test/features/login.test.tsx
git commit -m "feat: 在登录页内切换认证表单

- 将注册和忘记密码表单收归登录 Feature
- 使用本地模式切换避免认证表单路由跳转
- 保留登录成功后的首页导航行为"
```

---

### Task 2: 删除独立认证页面与路由

**Files:**

- Delete: `src/features/register/index.tsx`
- Delete: `src/features/forgot-password/index.tsx`
- Delete: `src/pages/register/index.tsx`
- Delete: `src/pages/forgot-password/index.tsx`
- Modify: `src/router/routes.tsx`
- Delete: `test/features/register.test.tsx`
- Delete: `test/features/forgot-password.test.tsx`
- Modify: `test/router/routes.test.tsx`

**Interfaces:**

- 路由表只保留 `/login` 认证页面，不再包含 `/register` 或 `/forgot-password`。
- 认证表单测试集中在 `test/features/login.test.tsx`。

- [ ] **Step 1: Add failing route-removal assertions**

在 `test/router/routes.test.tsx` 增加或修改测试：

```tsx
it('does not expose standalone registration or recovery routes', () => {
  expect(
    findRoute(routes, (route) => route.path === '/register')
  ).toBeUndefined()
  expect(
    findRoute(routes, (route) => route.path === '/forgot-password')
  ).toBeUndefined()
})
```

同时移除原来检查两个独立认证路由标题和 element 的断言。

- [ ] **Step 2: Run route and feature tests to verify failure**

Run: `pnpm exec vitest run test/router/routes.test.tsx test/features/login.test.tsx`

Expected: FAIL while the old standalone routes and files still exist, until implementation removes them and updates the test suite.

- [ ] **Step 3: Remove standalone files and route entries**

从 `src/router/routes.tsx` 删除 `/register` 和 `/forgot-password` 两个 route object；删除对应页面、Feature 和测试文件。确保 `routes.tsx` 仍保留 `/login`、404 以及后台路由。

- [ ] **Step 4: Run focused route and feature tests to verify pass**

Run: `pnpm exec vitest run test/router/routes.test.tsx test/features/login.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit standalone route removal**

```bash
git add -u src/features/register src/features/forgot-password src/pages/register src/pages/forgot-password src/router/routes.tsx test/features/register.test.tsx test/features/forgot-password.test.tsx test/router/routes.test.tsx
git commit -m "refactor: 移除独立认证表单路由

- 删除注册和忘记密码独立页面及测试
- 移除对应懒加载路由入口
- 将认证表单测试集中到登录 Feature"
```

---

### Task 3: 全量验证与变更范围检查

**Files:**

- Modify: only files required by Tasks 1-2 test or lint fixes

- [ ] **Step 1: Run all authentication tests**

Run: `pnpm exec vitest run test/features/login.test.tsx test/router/routes.test.tsx`

Expected: all authentication and route tests pass。

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: ESLint exits with code 0。

- [ ] **Step 3: Run production build**

Run: `pnpm build`

Expected: TypeScript checks and Vite production build complete successfully。

- [ ] **Step 4: Inspect route and file references**

Run: `git grep -n -E "(/register|/forgot-password|features/register|features/forgot-password|pages/register|pages/forgot-password)" -- ':!docs/*'

Expected: no standalone route, import, link or deleted-file reference remains；认证入口只存在于 `src/features/login/index.tsx` 的本地模式切换逻辑。

- [ ] **Step 5: Inspect final diff**

Run: `git status --short && git diff main...HEAD --stat`

Expected: 变更只包含登录 Feature 内表单切换、独立认证文件删除、路由/测试调整和本需求文档，不包含后台业务无关改动。
