# 菜单与路由权限访问控制（第一版：角色过滤）设计

日期：2026-08-25
状态：已确认（用户已批准设计）

## 背景

项目已为权限控制预埋完整基础设施，但全部以「放行一切」接线，缺少真实权限数据源：

- `RouteMeta.permission?: string | string[]` 类型已存在（`src/router/types.ts`），当前无任何路由声明它
- `PermissionChecker`、`hasRoutePermission`、`allowAllPermissions` 已存在（`src/router/permissions.ts`）
- `buildRouter(routes, checker)`（`src/router/utils/index.ts:11`）与 `routeToMenus(routes, checker)`（`src/router/menu.ts:21`）均已支持按权限过滤
- 三个调用点（`src/router/index.ts:5`、`src/components/Menu/menus.tsx:134`、`src/components/Header/index.tsx:28`）目前全部使用 `allowAllPermissions`
- `AuthUser`（`src/service/auth.ts:11`）无角色字段，无获取当前用户信息的接口

## 接口实测结论（GET /users/me）

用 admin 账号登录后实测 `GET /users/me`，返回结构如下（`id`/`roleId` 实际为字符串，现有类型标注为 `number`，本次不处理仅记录）：

```json
{
  "id": "7",
  "nickname": "admin",
  "email": "123456@qq.com",
  "gender": 2,
  "avatar": "",
  "roleId": "1",
  "status": 0,
  "delFlag": 0,
  "lastLoginIp": "::1",
  "lastLoginTime": "2026-08-25T03:55:12.000Z",
  "remark": "",
  "createdAt": "2026-08-22T01:29:00.412Z",
  "updatedAt": "2026-08-25T03:55:12.000Z",
  "role": { "id": "1", "name": "超级管理员", "roleKey": "admin" }
}
```

结论：

1. 接口**不返回任何权限码（permissions）字段**，权限判定依据只能是 `data.role.roleKey`（角色编码）——与第一版「按角色过滤」的目标一致。
2. 返回结构与现有 `UserItem` 类型（`src/service/users.ts:13`）完全兼容，`getUserInfo()` 直接复用该类型。
3. 既有偏差（本次不处理，仅记录）：接口 `id`/`roleId` 实际为字符串，现有类型标注为 `number`。

## 目标（第一版）

按**角色**过滤菜单与路由入口：

- 超级管理员（`roleKey === 'admin'`）能看到全部菜单与路由
- 普通用户只能看到被授予的角色码对应的入口
- 无权限路由访问表现：404 页面（菜单隐藏 + 路由守卫拦截）

## 非目标（后续版本再做）

- 按钮级（操作级）权限控制
- 权限码（permission code）模型与后端权限表对接
- 动态路由注入（按权限动态注册路由）

## 决策记录

| 决策点         | 结论                                                | 理由                                                                                                                                            |
| -------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 权限数据来源   | 新增 `GET /users/me`（需鉴权）                      | 用户指定；登录响应只含 token + user                                                                                                             |
| 用户信息结构   | 复用 `UserItem`（含 `role: { id, name, roleKey }`） | 后端返回结构（用户提供样例）与 `UserItem` 一致，零重复定义                                                                                      |
| 超级管理员编码 | `roleKey === 'admin'`，常量 `SUPER_ADMIN_ROLE_KEY`  | 用户指定（与后端角色表约定）                                                                                                                    |
| 路由声明字段   | 复用 `meta.permission` 暂存角色码                   | 用户指定；`buildRouter`/`routeToMenus`/`hasRoutePermission` 零改动，后续升级权限码时字段语义自然过渡                                            |
| 架构           | 静态全量注册路由 + `PermissionGuard` 守卫跳 `/404`  | `src/service/request.ts:4` 依赖模块级 router 单例做 401 登出跳转，动态重建 router 会破坏该引用；守卫方案改动集中且符合现有「守卫包 Layout」风格 |
| 无权限表现     | 菜单隐藏 + 直访跳 404                               | 用户指定                                                                                                                                        |

## 架构

```
登录页
  → POST /auth/login（成功：setToken + setUser）
  → navigate('/')
  → Layout 挂载 → GET /users/me（拦截器自动带 Bearer token）
      ├─ 401 ──► authLogout：清 token/user/roleKey → 回登录页
      └─ 成功 ──► setUser(完整用户) + setRoleKey(data.role.roleKey)
  → roleKey 变化（Zustand 响应式），驱动两处消费：
      ├─ 菜单：routeToMenus(routes, createRoleChecker(roleKey)) → 过滤菜单项
      └─ 守卫：PermissionGuard 检查匹配链，不通过 <Navigate to="/404" replace />
```

### 权限判定（createRoleChecker 决策）

```
检查函数(permission 声明)
  ├─ permission 未声明（undefined）─────► ✅ 放行（公共页面）
  ├─ roleKey === 'admin'（超管）────────► ✅ 恒放行（看全部）
  ├─ roleKey === null（角色未加载）─────► ❌ 拒绝
  └─ required.includes(roleKey)（角色码匹配）
        ├─ 包含 ──► ✅ 放行
        └─ 不包含 ─► ❌ 拒绝
```

## 改动清单

| 文件                                     | 改动                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/service/users.ts`                   | 新增 `UserInfo = UserItem` 类型别名、`getUserInfo()` 接口（`GET /users/me`）                                          |
| `src/features/auth/hooks/useUserInfo.ts` | 新增：`useRequest(getUserInfo)` 薄封装                                                                                |
| `src/store/useAuthor.ts`                 | 新增 `roleKey: string                                                                                                 | null`（初始 `null`）与 `setRoleKey` action，persist 自动持久化 |
| `src/router/permissions.ts`              | 新增 `SUPER_ADMIN_ROLE_KEY = 'admin'` 常量、`createRoleChecker(roleKey)` 工厂                                         |
| `src/router/guards/PermissionGuard.tsx`  | 新增守卫组件                                                                                                          |
| `src/router/routes.tsx`                  | `PermissionGuard` 包在 Layout 外层；`/system/users`、`/system/roles` 声明 `permission: 'admin'`（注释说明第一版语义） |
| `src/layout/baseLayout.tsx`              | 挂载时 `useUserInfo`（immediate），`onSuccess` 写 store                                                               |
| `src/service/request.ts`                 | `authLogout` 增加 `setRoleKey(null)`（防上次登录角色残留）                                                            |
| `src/components/Menu/menus.tsx`          | `routeToMenus` 改用 `createRoleChecker(roleKey)`                                                                      |
| `src/components/Header/index.tsx`        | 同上（面包屑联动）                                                                                                    |
| `test/router/permissions.test.ts`        | 扩展 `createRoleChecker` 用例                                                                                         |
| `test/router/PermissionGuard.test.tsx`   | 新增守卫渲染测试                                                                                                      |

不改动：`src/router/index.ts`（router 单例）、`src/router/utils/index.ts`、`src/router/menu.ts`（默认参数保留）、`src/pages/login/index.tsx`（登录流程不变）。

## 详细设计

### 1. 数据源（`src/service/users.ts`）

```ts
/** 当前登录用户完整信息（含角色），结构同用户列表项 */
export type UserInfo = UserItem

/** 获取当前登录用户信息（需鉴权） */
export function getUserInfo(signal?: AbortSignal) {
  return http.get<UserInfo>('/users/me', { signal })
}
```

### 2. Hook（`src/features/auth/hooks/useUserInfo.ts`）

```ts
import { useRequest } from '@/hooks'
import { getUserInfo, type UserInfo } from '@/service/users'

/** 当前登录用户信息：挂载即拉取，含角色 */
export function useUserInfo() {
  return useRequest(getUserInfo)
}

export type { UserInfo }
```

### 3. Store（`src/store/useAuthor.ts`）

- `State` 增加 `roleKey: string | null`，初始 `null`
- `Action` 增加 `setRoleKey: (roleKey: string | null) => void`
- `persist` 自动持久化，刷新后角色立即可用

### 4. Checker（`src/router/permissions.ts`）

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

`allowAllPermissions`、`hasRoutePermission` 原样保留（默认参数与现有测试继续使用）。

### 5. 守卫（`src/router/guards/PermissionGuard.tsx`）

```tsx
export default function PermissionGuard() {
  const roleKey = useAuthor((state) => state.roleKey)
  const matches = useMatches()

  const denied = useMemo(() => {
    const checker = createRoleChecker(roleKey)
    return matches.some(
      (m) => !hasRoutePermission(m.handle as RouteMeta | undefined, checker)
    )
  }, [matches, roleKey])

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

- `useMatches()` 返回完整匹配链（含守卫自身），各级 `handle` 含 `buildRouter` 合并的 `meta`（`src/router/utils/index.ts:26`）
- 子路由不重复声明角色码：守卫检查链上各级，父级声明已覆盖
- `/404`、`*`、`/login` 在守卫之外，不受影响

### 6. 路由声明（`src/router/routes.tsx`）

```tsx
// 第一版：permission 暂存角色码，仅超级管理员（roleKey=admin）可访问
{
  path: '/system/users',
  meta: { title: '用户管理', menuKey: 'system-users', icon: Users, permission: 'admin' },
  ...
}
{
  path: '/system/roles',
  meta: { title: '角色管理', menuKey: 'system-roles', icon: ShieldCheck, permission: 'admin' },
  ...
}
```

- 首页 `/` 无声明：所有登录用户可见
- 子路由（`''` 列表页、`:id` 详情页）不声明：父级已覆盖
- 菜单侧：`routeToMenus` 的「父级所有子路由被拒则隐藏目录」逻辑（`src/router/menu.ts:40-46`）已存在，普通用户登录后「系统管理」目录整体隐藏

### 7. 拉取时机（`src/layout/baseLayout.tsx`）

```tsx
const setUser = useAuthor((state) => state.setUser)
const setRoleKey = useAuthor((state) => state.setRoleKey)

useUserInfo({
  onSuccess: (data) => {
    setUser(data)
    setRoleKey(data.role?.roleKey ?? null)
  },
})
```

- `useRequest` 的 `immediate` 默认 `true`，挂载即拉取
- 登录后 `navigate('/')` 触发 Layout 挂载 → 拉取；刷新后 persist 数据先行渲染、拉取结果覆盖
- 拉取失败静默（`onError` 不处理）：401 由拦截器统一 `authLogout`，其余错误保留现有数据

### 8. 登出清理（`src/service/request.ts`）

```ts
export function authLogout() {
  useAuthor.getState().setToken('')
  useAuthor.getState().setUser(null)
  useAuthor.getState().setRoleKey(null)
  router.navigate('/login', { replace: true })
}
```

防止上次登录的角色在下次登录时闪现。

### 9. 接线点（`src/components/Menu/menus.tsx`、`src/components/Header/index.tsx`）

```tsx
const roleKey = useAuthor((state) => state.roleKey)
const menus = useMemo(
  () => routeToMenus(routes, createRoleChecker(roleKey)),
  [roleKey]
)
```

`useMemo` 依赖由空数组改为 `[roleKey]`。

## 测试计划

- `test/router/permissions.test.ts` 扩展：`createRoleChecker` 四类用例
  - 未声明权限放行
  - 超级管理员恒放行（单值/数组声明均放行）
  - 普通用户角色码匹配放行
  - 普通用户角色码不匹配拒绝、`roleKey === null` 拒绝
- `test/router/PermissionGuard.test.tsx` 新增：`createMemoryRouter` 手写路由树（不依赖现有过期测试）
  - 有权限渲染子路由
  - 无权限重定向 `/404`
- 验收命令：`pnpm lint`、`pnpm compile`、相关单测

## 验收标准

1. 超级管理员（roleKey=`admin`）登录：菜单显示「首页」「系统管理/用户管理/角色管理」，全部路由可访问
2. 普通用户（roleKey≠`admin`）登录：菜单仅显示「首页」，系统管理目录整体隐藏
3. 普通用户直访 `/system/users`、`/system/roles`：重定向 `/404` 页面
4. 刷新页面：权限不丢失（persist 先行 + `/users/me` 覆盖）
5. 登出后换账号登录：不闪现上一账号的角色菜单

## 已知过期测试（不在本次范围，仅备注）

`test/router/routes.test.tsx`（断言 `/system/roles/detail` 子路由）、`test/components/Menu.test.tsx`、`test/pages/level-one/level-three.test.tsx` 等引用已删除的旧路由，与本次改动无关，不在此次需求内修正。
