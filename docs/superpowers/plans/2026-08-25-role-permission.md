# 菜单与路由角色权限控制（第一版）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按角色（roleKey）过滤菜单与路由入口：超级管理员（`admin`）看全部，普通用户按声明角色码匹配，无权限直访跳 404。

**Architecture:** 复用已预埋的权限基础设施（`RouteMeta.permission`、`hasRoutePermission`、`routeToMenus(routes, checker)`），新增真实数据源（`GET /users/me` → store.roleKey）与 `createRoleChecker` 工厂；路由静态全量注册，新增 `PermissionGuard` 守卫包在 Layout 外层，匹配链任一级无权限即 `<Navigate to="/404" replace />`。

**Tech Stack:** React 19、React Router 7、Zustand（persist）、Vitest + Testing Library、pnpm。

## Global Constraints

- 设计文档：`docs/superpowers/specs/2026-08-25-role-permission-design.md`（已提交 `aab1e4f`，分支 `lifangzheng/docs/role_permission_design`，实现继续在该分支进行）
- 超级管理员角色编码常量：`SUPER_ADMIN_ROLE_KEY = 'admin'`（与后端角色表约定）
- `src/service/` 下的接口函数不得直接调用，必须搭配 `src/hooks/useRequest`（项目 AGENTS.md 强制）
- 路由声明第一版语义：`meta.permission` 暂存**角色码**（如 `'admin'`），加注释说明
- 无权限路由表现：菜单隐藏 + 直访跳 `/404`（复用现有 404 页与 `*` 兜底）
- 不改动：`src/router/index.ts`（router 单例）、`src/router/utils/index.ts`、`src/router/menu.ts`（默认参数保留）、`src/pages/login/index.tsx`
- 已知过期测试（`test/router/routes.test.tsx`、`test/components/Menu.test.tsx`、`test/pages/level-one/level-three.test.tsx` 引用已删除路由）不在本次范围，不修复不运行
- 测试验证阶段只需运行 `pnpm lint`、`pnpm compile` 与相关单测，不执行 `pnpm build`
- 提交信息遵循 git-conventions：`<type>: <主题>` + 3-6 条动词开头要点，中文，逐文件 `git add` 禁止 `git add .`

---

### Task 1: 数据源层（service 接口 + store 角色状态 + useUserInfo hook）

**Files:**

- Modify: `src/service/users.ts`（追加类型与接口，文件末尾）
- Modify: `src/store/useAuthor.ts`（State/Action/初始值）
- Create: `src/features/auth/hooks/useUserInfo.ts`
- Modify: `src/features/auth/hooks/index.ts`（追加导出行）
- Test: `test/store/useAuthor.test.ts`（新建）

**Interfaces:**

- Produces:
  - `src/service/users.ts` → `export type UserInfo = UserItem`、`export function getUserInfo(signal?: AbortSignal): Promise<{ data: UserInfo }>`（经 http 拦截器 unwrap，useRequest 包装后实际返回 `UserInfo`）
  - `src/store/useAuthor.ts` → `roleKey: string | null`（state）、`setRoleKey: (roleKey: string | null) => void`（action）
  - `src/features/auth/hooks/useUserInfo.ts` → `export function useUserInfo()`：挂载即拉取，成功后 `setUser(data)` + `setRoleKey(data.role?.roleKey ?? null)`；同时 `export type { UserInfo }`
  - `src/features/auth/hooks/index.ts` → 追加 `export * from './useUserInfo'`

- [ ] **Step 1: 写失败的 store 测试** `test/store/useAuthor.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import useAuthor from '@/store/useAuthor'

describe('useAuthor roleKey', () => {
  beforeEach(() => {
    useAuthor.setState({ roleKey: null })
  })

  it('初始 roleKey 为 null', () => {
    expect(useAuthor.getState().roleKey).toBeNull()
  })

  it('setRoleKey 更新角色编码', () => {
    useAuthor.getState().setRoleKey('admin')
    expect(useAuthor.getState().roleKey).toBe('admin')
  })

  it('setRoleKey 支持清空', () => {
    useAuthor.setState({ roleKey: 'admin' })
    useAuthor.getState().setRoleKey(null)
    expect(useAuthor.getState().roleKey).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/store/useAuthor.test.ts`
Expected: FAIL（`roleKey` 类型不存在 / 断言 `toBeNull` 失败）

- [ ] **Step 3: 实现 store 字段** `src/store/useAuthor.ts`

```ts
type State = {
  token: string | number
  user: AuthUser | null
  roleKey: string | null
  account: string
  encryptedPassword: string
  remember: boolean
}

type Action = {
  setToken: (token: State['token']) => void
  setUser: (user: AuthUser | null) => void
  setRoleKey: (roleKey: string | null) => void
  saveCredentials: (account: string, password: string) => Promise<void>
  clearCredentials: () => void
  getCredentials: () => Promise<
    (Pick<State, 'account' | 'remember'> & { password: string }) | null
  >
}
```

初始值对象中 `user: null` 后加一行 `roleKey: null,`；`setUser` 实现后追加：

```ts
setRoleKey: (roleKey: string | null) => {
  set({ roleKey })
},
```

- [ ] **Step 4: 实现 service 接口** `src/service/users.ts`（文件末尾追加）

```ts
/** 当前登录用户完整信息（含角色），结构同用户列表项 */
export type UserInfo = UserItem

/** 获取当前登录用户信息（需鉴权） */
export function getUserInfo(signal?: AbortSignal) {
  return http.get<UserInfo>('/users/me', { signal })
}
```

- [ ] **Step 5: 实现 hook** `src/features/auth/hooks/useUserInfo.ts`（新建）

```ts
import { useRequest } from '@/hooks'
import { getUserInfo, type UserInfo } from '@/service/users'
import useAuthor from '@/store/useAuthor'

/** 当前登录用户信息：挂载即拉取，成功后写入认证 store（含角色编码）；401 由请求拦截器统一登出 */
export function useUserInfo() {
  const setUser = useAuthor((state) => state.setUser)
  const setRoleKey = useAuthor((state) => state.setRoleKey)

  return useRequest(getUserInfo, {
    onSuccess: (data) => {
      setUser(data)
      setRoleKey(data.role?.roleKey ?? null)
    },
  })
}

export type { UserInfo }
```

`src/features/auth/hooks/index.ts` 追加一行：

```ts
export * from './useUserInfo'
```

- [ ] **Step 6: 运行测试确认通过**

Run: `pnpm exec vitest run test/store/useAuthor.test.ts`
Expected: PASS（3 个用例）

- [ ] **Step 7: 提交**

```bash
git add src/service/users.ts src/store/useAuthor.ts src/features/auth/hooks/useUserInfo.ts src/features/auth/hooks/index.ts test/store/useAuthor.test.ts
git commit -m "feat: 新增用户信息接口与角色状态

- useAuthor 增加 roleKey 字段与 setRoleKey action，persist 自动持久化角色编码
- 新增 GET /users/me 接口与 UserInfo 类型，复用 UserItem 结构
- 新增 useUserInfo hook：挂载即拉取用户信息并写入认证 store"
```

---

### Task 2: 角色权限检查器 createRoleChecker

**Files:**

- Modify: `src/router/permissions.ts`（追加常量与工厂函数）
- Test: `test/router/permissions.test.ts`（追加 describe 块与 import）

**Interfaces:**

- Consumes: `PermissionChecker` 类型（已存在，`src/router/permissions.ts:3`）
- Produces: `export const SUPER_ADMIN_ROLE_KEY = 'admin'`、`export const createRoleChecker(roleKey: string | null): PermissionChecker`——语义：未声明权限放行；超管恒放行；`roleKey === null` 拒绝；数组声明需包含用户角色（任一匹配即放行）

- [ ] **Step 1: 写失败的测试**（`test/router/permissions.test.ts` 顶部 import 追加 `createRoleChecker, SUPER_ADMIN_ROLE_KEY`，文件末尾追加）

```ts
describe('createRoleChecker', () => {
  it('未声明权限时放行', () => {
    expect(createRoleChecker('user')(undefined)).toBe(true)
  })

  it('超级管理员恒放行（含数组声明）', () => {
    const checker = createRoleChecker(SUPER_ADMIN_ROLE_KEY)
    expect(checker('admin')).toBe(true)
    expect(checker(['user', 'editor'])).toBe(true)
  })

  it('角色码匹配时放行', () => {
    expect(createRoleChecker('editor')('editor')).toBe(true)
    expect(createRoleChecker('editor')(['user', 'editor'])).toBe(true)
  })

  it('角色码不匹配时拒绝', () => {
    expect(createRoleChecker('user')('admin')).toBe(false)
    expect(createRoleChecker('user')(['admin', 'editor'])).toBe(false)
  })

  it('角色未加载（null）时拒绝', () => {
    expect(createRoleChecker(null)('admin')).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/router/permissions.test.ts`
Expected: FAIL（`createRoleChecker` is not defined）

- [ ] **Step 3: 实现** `src/router/permissions.ts`（文件末尾追加）

```ts
/** 超级管理员角色编码（与后端角色表约定） */
export const SUPER_ADMIN_ROLE_KEY = 'admin'

/** 基于当前用户角色构造检查器：超级管理员恒放行；其余按声明角色码匹配 */
export const createRoleChecker =
  (roleKey: string | null): PermissionChecker =>
  (permission) => {
    if (permission === undefined) return true
    if (roleKey === SUPER_ADMIN_ROLE_KEY) return true
    if (roleKey === null) return false
    const required = Array.isArray(permission) ? permission : [permission]
    return required.includes(roleKey)
  }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/router/permissions.test.ts`
Expected: PASS（原 4 用例 + 新 5 用例）

- [ ] **Step 5: 提交**

```bash
git add src/router/permissions.ts test/router/permissions.test.ts
git commit -m "feat: 新增角色权限检查器

- 新增 createRoleChecker 工厂：超级管理员恒放行，其余按声明角色码匹配，角色未加载时拒绝
- 新增 SUPER_ADMIN_ROLE_KEY 常量，与后端角色表约定 admin 为超管编码"
```

---

### Task 3: 路由权限守卫 PermissionGuard

**Files:**

- Create: `src/router/guards/PermissionGuard.tsx`
- Test: `test/router/PermissionGuard.test.tsx`（新建）

**Interfaces:**

- Consumes: `createRoleChecker`、`hasRoutePermission`（`@/router/permissions`）、`useAuthor` 的 `roleKey`、`RouteMeta`（`@/router/types`）
- Produces: `export default function PermissionGuard()`——渲染 `<Outlet />` 或 `<Navigate to="/404" replace />`

- [ ] **Step 1: 写失败的测试** `test/router/PermissionGuard.test.tsx`（新建）

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import PermissionGuard from '@/router/guards/PermissionGuard'
import useAuthor from '@/store/useAuthor'

const createTestRouter = () =>
  createMemoryRouter(
    [
      {
        element: <PermissionGuard />,
        children: [
          {
            path: '/',
            element: <div>有权限页面</div>,
            handle: { permission: 'admin' },
          },
        ],
      },
      { path: '/404', element: <div>404页面</div> },
    ],
    { initialEntries: ['/'] }
  )

describe('PermissionGuard', () => {
  beforeEach(() => {
    useAuthor.setState({ roleKey: null })
  })

  it('角色匹配时渲染子路由', () => {
    useAuthor.setState({ roleKey: 'admin' })
    render(<RouterProvider router={createTestRouter()} />)
    expect(screen.getByText('有权限页面')).toBeTruthy()
  })

  it('角色不匹配时重定向 404', () => {
    useAuthor.setState({ roleKey: 'user' })
    render(<RouterProvider router={createTestRouter()} />)
    expect(screen.getByText('404页面')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/router/PermissionGuard.test.tsx`
Expected: FAIL（Cannot find module `@/router/guards/PermissionGuard`）

- [ ] **Step 3: 实现** `src/router/guards/PermissionGuard.tsx`（新建）

```tsx
import { useMemo } from 'react'
import { Navigate, Outlet, useMatches } from 'react-router'
import { createRoleChecker, hasRoutePermission } from '@/router/permissions'
import type { RouteMeta } from '@/router/types'
import useAuthor from '@/store/useAuthor'

/** 入口级权限守卫：匹配链上任一级路由声明角色无权限即重定向 404 */
export default function PermissionGuard() {
  const roleKey = useAuthor((state) => state.roleKey)
  const matches = useMatches()

  const denied = useMemo(
    () =>
      matches.some(
        (match) =>
          !hasRoutePermission(
            match.handle as RouteMeta | undefined,
            createRoleChecker(roleKey)
          )
      ),
    [matches, roleKey]
  )

  if (denied)
    return (
      <Navigate
        to='/404'
        replace
      />
    )
  return <Outlet />
}
```

说明：`buildRouter` 已把 `meta` 并入 `handle`（`src/router/utils/index.ts:26`），匹配链上无 `handle`/`meta` 的层级（守卫自身、BasicGuard）因 `meta?.permission === undefined` 天然放行。

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/router/PermissionGuard.test.tsx`
Expected: PASS（2 个用例）

- [ ] **Step 5: 提交**

```bash
git add src/router/guards/PermissionGuard.tsx test/router/PermissionGuard.test.tsx
git commit -m "feat: 新增路由权限守卫

- 新增 PermissionGuard：遍历匹配链检查各级路由声明角色，无权限重定向 404
- 复用 hasRoutePermission 与 createRoleChecker，子路由无需重复声明角色"
```

---

### Task 4: 路由声明角色权限并接线守卫

**Files:**

- Modify: `src/router/routes.tsx`

**Interfaces:**

- Consumes: `PermissionGuard`（Task 3）
- Produces: Layout 整体被 `PermissionGuard` 包裹；`/system/users`、`/system/roles` 声明 `permission: 'admin'`

- [ ] **Step 1: 接线守卫** `src/router/routes.tsx`

import 区追加：

```tsx
import PermissionGuard from './guards/PermissionGuard'
```

BasicGuard children 中，把 Layout 节点包进 PermissionGuard（`/404`、`*`、`/login` 保持在守卫之外）：

```tsx
{
  element: <BasicGuard />,
  children: [
    {
      element: <PermissionGuard />,
      children: [
        {
          element: <Layout />,
          children: [
            // ...原有 Layout 下的业务路由不变
          ],
        },
      ],
    },
    // ...原有 404-page、404-catch、login 不变
  ],
},
```

- [ ] **Step 2: 声明角色权限**（`routes.tsx` 中 `/system/users` 与 `/system/roles` 的 meta）

`/system/users`（用户管理）meta 追加：

```tsx
// 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
permission: 'admin',
```

`/system/roles`（角色管理）meta 追加同样的 `permission: 'admin',`（注释可省略，同文件已说明语义）。

子路由（`''` 列表页、`:id` 详情页）不声明：守卫检查匹配链上各级，父级声明已覆盖。

- [ ] **Step 3: 验证**

Run: `pnpm lint` 与 `pnpm compile`
Expected: 均通过，无新增错误

- [ ] **Step 4: 提交**

```bash
git add src/router/routes.tsx
git commit -m "feat: 路由声明角色权限

- 系统管理下用户管理、角色管理入口声明 permission=admin，第一版按角色过滤仅超管可见
- PermissionGuard 包裹 Layout，登录页与 404 保持守卫之外"
```

---

### Task 5: 菜单与面包屑按角色过滤

**Files:**

- Modify: `src/components/Menu/menus.tsx`
- Modify: `src/components/Header/index.tsx`

**Interfaces:**

- Consumes: `createRoleChecker`（Task 2）、`useAuthor` 的 `roleKey`（Task 1）
- Produces: 侧边栏菜单与 Header 面包屑均按 `routeToMenus(routes, createRoleChecker(roleKey))` 过滤

- [ ] **Step 1: 改菜单组件** `src/components/Menu/menus.tsx`

import 调整（移除 `allowAllPermissions`，追加 `createRoleChecker` 与 `useAuthor`）：

```tsx
import useAuthor from '@/store/useAuthor'
import { routeToMenus } from '@/router/menu'
import { createRoleChecker } from '@/router/permissions'
```

`Menus` 组件内替换：

```tsx
const roleKey = useAuthor((state) => state.roleKey)
const menus = useMemo(
  () => routeToMenus(routes, createRoleChecker(roleKey)),
  [roleKey]
)
```

- [ ] **Step 2: 改 Header 面包屑** `src/components/Header/index.tsx`

import 调整（移除 `allowAllPermissions`，追加 `createRoleChecker`）：

```tsx
import { routeToMenus } from '@/router/menu'
import { createRoleChecker } from '@/router/permissions'
```

`Header` 组件内替换：

```tsx
const roleKey = useAuthor((state) => state.roleKey)
const menus = useMemo(
  () => routeToMenus(routes, createRoleChecker(roleKey)),
  [roleKey]
)
```

（`useAuthor` 已在该文件导入）

- [ ] **Step 3: 验证**

Run: `pnpm lint` 与 `pnpm compile`
Expected: 均通过（注意确认无 `allowAllPermissions` 残留未使用 import）

- [ ] **Step 4: 提交**

```bash
git add src/components/Menu/menus.tsx src/components/Header/index.tsx
git commit -m "feat: 菜单与面包屑按角色过滤

- 侧边栏菜单改用 createRoleChecker(roleKey) 生成，普通用户隐藏无权限入口
- Header 面包屑同步过滤，父级所有子级被拒时目录整体隐藏（routeToMenus 既有逻辑）"
```

---

### Task 6: 登录后拉取角色与登出清理

**Files:**

- Modify: `src/layout/baseLayout.tsx`
- Modify: `src/service/request.ts`（authLogout）

**Interfaces:**

- Consumes: `useUserInfo`（Task 1）
- Produces: Layout 挂载即拉取用户信息（含角色）；登出时清空 `roleKey`

- [ ] **Step 1: 接线拉取** `src/layout/baseLayout.tsx`

import 追加：

```tsx
import { useUserInfo } from '@/features/auth/hooks'
```

组件内（`useMenu` 取值之后）追加：

```tsx
// 挂载即拉取当前用户信息（含角色）写入 store；401 由请求拦截器统一登出
useUserInfo()
```

- [ ] **Step 2: 登出清理** `src/service/request.ts` 的 `authLogout`

```ts
export function authLogout() {
  useAuthor.getState().setToken('')
  useAuthor.getState().setUser(null)
  useAuthor.getState().setRoleKey(null)
  router.navigate('/login', { replace: true })
}
```

（防止上次登录的角色在下次登录时闪现）

- [ ] **Step 3: 验证**

Run: `pnpm lint`、`pnpm compile`、`pnpm exec vitest run test/features/login.test.tsx`
Expected: 均通过（登录流程未改动，回归确认）

- [ ] **Step 4: 提交**

```bash
git add src/layout/baseLayout.tsx src/service/request.ts
git commit -m "feat: 登录后拉取角色并清理登出状态

- Layout 挂载即拉取 GET /users/me 写入认证 store，刷新后 persist 先行、拉取覆盖
- authLogout 清空 roleKey，避免切换账号时闪现上一账号的角色菜单"
```

---

### Task 7: 整体验收

- [ ] **Step 1: 全量相关测试**

Run: `pnpm exec vitest run test/router/permissions.test.ts test/router/PermissionGuard.test.tsx test/store/useAuthor.test.ts test/features/login.test.tsx test/router/menu.test.ts test/components/NavTabSync.test.tsx test/components/useMenuBreadcrumb.test.ts`
Expected: 全部 PASS（menu/NavTab/useMenuBreadcrumb 使用默认 checker 或显式 `allowAllPermissions`，不受改动影响）

- [ ] **Step 2: 静态检查**

Run: `pnpm lint` 与 `pnpm compile`
Expected: 均通过

- [ ] **Step 3: 手动行为核验（可选，dev server）**

Run: `pnpm dev`，分别用超管与非超管账号登录，核对：

- 超管（roleKey=admin）：菜单含「首页」「系统管理/用户管理」「系统管理/角色管理」，直访 `/system/users` 正常
- 普通用户：菜单仅「首页」；直访 `/system/users`、`/system/roles` 重定向 `/404`
- 刷新页面权限不丢失；登出后换账号无角色菜单闪现

- [ ] **Step 4: 收尾检查**

Run: `git status` 确认工作区干净；`git log --oneline` 确认 6 个功能提交在 `lifangzheng/docs/role_permission_design` 分支上
