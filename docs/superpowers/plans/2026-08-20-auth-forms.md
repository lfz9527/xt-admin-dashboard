# 注册与忘记密码表单 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有登录演示页中新增注册与忘记密码模拟表单，并通过公开路由和登录页入口提供访问。

**Architecture:** 分别新增 `register` 与 `forgot-password` Feature，各自使用 `react-hook-form`、`zod` 和现有 UI 表单组件维护独立 schema 与提交逻辑。新增对应页面壳和公开路由；提交只模拟等待、Toast 成功提示并返回登录页，不引入真实接口或认证状态。

**Tech Stack:** React 19、TypeScript、React Router、react-hook-form、zod、Vitest、Testing Library、Tailwind CSS。

## Global Constraints

- 验证码只校验非空，不发送真实请求，不增加验证码按钮或倒计时。
- 注册字段固定为邮箱、用户名、验证码、密码、确认密码。
- 忘记密码字段固定为邮箱、验证码、新密码、确认密码。
- 复用现有 `Logo`、`Card`、`Input`、`Button`、`Spinner`、`Toast` 和 `Form` 组件。
- 不修改现有登录模拟认证逻辑，不新增服务端请求、认证状态或密码持久化。
- 提交成功后调用 `toast.success`，并使用 `navigate('/login', { replace: true })` 返回登录页。
- 修改行为后运行相关测试、`pnpm lint` 和 `pnpm build`。

---

### Task 1: 新增注册表单 Feature

**Files:**

- Create: `src/features/register/index.tsx`
- Test: `test/features/register.test.tsx`

**Interfaces:**

- Produces default export `RegisterFeature`，渲染邮箱、用户名、验证码、密码、确认密码字段。
- `RegisterFeature` 使用 `useNavigate`，提交成功导航到 `/login`。

- [ ] **Step 1: Write the failing tests**

在 `test/features/register.test.tsx` 中 mock `@/ui/Toast` 和 `react-router` 的 `useNavigate`，覆盖以下行为：

```tsx
it('shows validation messages for empty fields', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RegisterFeature />
    </MemoryRouter>
  )

  await user.click(screen.getByRole('button', { name: '注册' }))

  expect(await screen.findAllByRole('alert')).toHaveLength(5)
})

it('validates email and matching passwords', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RegisterFeature />
    </MemoryRouter>
  )

  await user.type(screen.getByLabelText('邮箱'), 'invalid')
  await user.type(screen.getByLabelText('用户名'), 'admin')
  await user.type(screen.getByLabelText('验证码'), '1234')
  await user.type(screen.getByLabelText('密码'), 'password')
  await user.type(screen.getByLabelText('确认密码'), 'different')
  await user.click(screen.getByRole('button', { name: '注册' }))

  expect(await screen.findByText('请输入有效的邮箱')).toBeInTheDocument()
  expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
})

it('simulates registration and navigates to login', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RegisterFeature />
    </MemoryRouter>
  )

  await user.type(screen.getByLabelText('邮箱'), 'admin@example.com')
  await user.type(screen.getByLabelText('用户名'), 'admin')
  await user.type(screen.getByLabelText('验证码'), '1234')
  await user.type(screen.getByLabelText('密码'), 'password')
  await user.type(screen.getByLabelText('确认密码'), 'password')
  await user.click(screen.getByRole('button', { name: '注册' }))

  expect(screen.getByRole('button', { name: /注册中/ })).toBeDisabled()
  await waitFor(
    () => expect(navigate).toHaveBeenCalledWith('/login', { replace: true }),
    { timeout: 2000 }
  )
  expect(toastSuccess).toHaveBeenCalledWith('注册成功')
})
```

- [ ] **Step 2: Run the registration tests to verify failure**

Run: `pnpm exec vitest run test/features/register.test.tsx`

Expected: FAIL because `@/features/register` does not exist.

- [ ] **Step 3: Implement the minimal registration Feature**

在 `src/features/register/index.tsx` 中：

1. 定义 `z.object` schema：
   - `email`: `z.string().email('请输入有效的邮箱')`
   - `username`: `z.string().min(1, '请输入用户名')`
   - `code`: `z.string().min(1, '请输入验证码')`
   - `password`: `z.string().min(1, '请输入密码')`
   - `confirmPassword`: `z.string().min(1, '请确认密码')`
2. 使用 `.refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: '两次输入的密码不一致' })`。
3. 使用 `useForm`、`zodResolver` 和现有 `FormField` 组件渲染字段。
4. 使用 `autoComplete='email'`、`username`、`new-password` 等浏览器语义属性。
5. `onSubmit` 等待 `1200ms`，调用 `toast.success('注册成功')`，再导航到登录页。
6. 提交按钮根据 `form.formState.isSubmitting` 展示 `Spinner` 与“注册中...”。
7. 使用现有登录页同款 `main`、`Card`、`Logo` 布局，并提供 `Link` 文案“返回登录”指向 `/login`。

- [ ] **Step 4: Run the registration tests to verify pass**

Run: `pnpm exec vitest run test/features/register.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit the registration Feature**

```bash
git add src/features/register/index.tsx test/features/register.test.tsx
git commit -m "feat: 新增注册模拟表单

- 增加邮箱用户名验证码和密码确认校验
- 模拟注册提交并提示成功后返回登录
- 覆盖注册表单校验和提交交互测试"
```

---

### Task 2: 新增忘记密码表单 Feature

**Files:**

- Create: `src/features/forgot-password/index.tsx`
- Test: `test/features/forgot-password.test.tsx`

**Interfaces:**

- Produces default export `ForgotPasswordFeature`，渲染邮箱、验证码、新密码、确认密码字段。
- `ForgotPasswordFeature` 提交成功导航到 `/login`。

- [ ] **Step 1: Write the failing tests**

在 `test/features/forgot-password.test.tsx` 中覆盖空字段、邮箱格式、密码一致性以及成功提交：

```tsx
it('shows validation messages for empty fields', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ForgotPasswordFeature />
    </MemoryRouter>
  )

  await user.click(screen.getByRole('button', { name: '重置密码' }))

  expect(await screen.findAllByRole('alert')).toHaveLength(4)
})

it('simulates password reset and navigates to login', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ForgotPasswordFeature />
    </MemoryRouter>
  )

  await user.type(screen.getByLabelText('邮箱'), 'admin@example.com')
  await user.type(screen.getByLabelText('验证码'), '1234')
  await user.type(screen.getByLabelText('新密码'), 'password')
  await user.type(screen.getByLabelText('确认密码'), 'password')
  await user.click(screen.getByRole('button', { name: '重置密码' }))

  expect(screen.getByRole('button', { name: /重置中/ })).toBeDisabled()
  await waitFor(
    () => expect(navigate).toHaveBeenCalledWith('/login', { replace: true }),
    { timeout: 2000 }
  )
  expect(toastSuccess).toHaveBeenCalledWith('密码重置成功')
})
```

- [ ] **Step 2: Run the forgot-password tests to verify failure**

Run: `pnpm exec vitest run test/features/forgot-password.test.tsx`

Expected: FAIL because `@/features/forgot-password` does not exist.

- [ ] **Step 3: Implement the minimal forgot-password Feature**

在 `src/features/forgot-password/index.tsx` 中：

1. 定义 `z.object` schema：
   - `email`: `z.string().email('请输入有效的邮箱')`
   - `code`: `z.string().min(1, '请输入验证码')`
   - `password`: `z.string().min(1, '请输入新密码')`
   - `confirmPassword`: `z.string().min(1, '请确认密码')`
2. 使用 `refine` 将不一致错误定位到 `confirmPassword`，提示“​​两次输入的密码不一致”。
3. 复用注册 Feature 的 Card、FormField、Spinner、Toast 和返回登录布局，但字段标签、标题、按钮文案改为忘记密码语义。
4. 提交等待 `1200ms` 后调用 `toast.success('密码重置成功')` 并导航到 `/login`。
5. 新密码字段使用 `autoComplete='new-password'`。

- [ ] **Step 4: Run the forgot-password tests to verify pass**

Run: `pnpm exec vitest run test/features/forgot-password.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit the forgot-password Feature**

```bash
git add src/features/forgot-password/index.tsx test/features/forgot-password.test.tsx
git commit -m "feat: 新增忘记密码模拟表单

- 增加邮箱验证码和新密码确认校验
- 模拟密码重置并提示成功后返回登录
- 覆盖重置表单校验和提交交互测试"
```

---

### Task 3: 接入认证页面路由与登录入口

**Files:**

- Create: `src/pages/register/index.tsx`
- Create: `src/pages/forgot-password/index.tsx`
- Modify: `src/router/routes.tsx:125-128`
- Modify: `src/features/login/index.tsx:1-173`
- Test: `test/router/routes.test.tsx`
- Test: `test/features/login.test.tsx`

**Interfaces:**

- `/register` renders `src/pages/register`。
- `/forgot-password` renders `src/pages/forgot-password`。
- Login Feature exposes links with accessible names “注册账号” and “忘记密码”。

- [ ] **Step 1: Extend route and login-entry tests**

在路由测试中断言路由树包含 `/register` 和 `/forgot-password`，在登录测试中断言：

```tsx
expect(screen.getByRole('link', { name: '注册账号' })).toHaveAttribute(
  'href',
  '/register'
)
expect(screen.getByRole('link', { name: '忘记密码' })).toHaveAttribute(
  'href',
  '/forgot-password'
)
```

- [ ] **Step 2: Run focused tests to verify failure**

Run: `pnpm exec vitest run test/router/routes.test.tsx test/features/login.test.tsx`

Expected: FAIL because the new routes and login links are absent.

- [ ] **Step 3: Add page wrappers and routes**

页面文件只导出 Feature：

```tsx
import RegisterFeature from '@/features/register'

export default function RegisterPage() {
  return <RegisterFeature />
}
```

忘记密码页面同样导出 `ForgotPasswordFeature`。在 `routes.tsx` 现有 `/login` 路由旁新增两个懒加载路由，并设置标题“注册”和“忘记密码”。

- [ ] **Step 4: Add login links without changing login submission logic**

在登录表单卡片中增加 `Link` 导入，并在记住密码区域或提交按钮下方增加两个链接：`注册账号` 指向 `/register`，`忘记密码` 指向 `/forgot-password`。保持现有字段、模拟登录等待、凭据存储和导航逻辑不变。

- [ ] **Step 5: Run focused tests to verify pass**

Run: `pnpm exec vitest run test/router/routes.test.tsx test/features/login.test.tsx test/features/register.test.tsx test/features/forgot-password.test.tsx`

Expected: PASS。

- [ ] **Step 6: Commit route integration**

```bash
git add src/pages/register/index.tsx src/pages/forgot-password/index.tsx src/router/routes.tsx src/features/login/index.tsx test/router/routes.test.tsx test/features/login.test.tsx
git commit -m "feat: 接入注册与忘记密码页面路由

- 增加认证页面懒加载路由和页面包装
- 在登录页提供注册与忘记密码入口
- 覆盖路由结构和登录入口链接测试"
```

---

### Task 4: 全量验证与质量检查

**Files:**

- Modify: only files required by test or lint fixes from Tasks 1-3

- [ ] **Step 1: Run all Vitest tests**

Run: `pnpm test`

Expected: all existing and new tests pass。

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: ESLint exits with code 0。

- [ ] **Step 3: Run production build**

Run: `pnpm build`

Expected: TypeScript checks and Vite production build complete successfully。

- [ ] **Step 4: Inspect final diff and status**

Run: `git diff main...HEAD --stat && git status --short`

Expected: diff contains only the design commit and the authentication form implementation; no generated files, dependencies, or unrelated refactors are present.
