# 三级菜单示例实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一组完整可见的“一级菜单 / 二级菜单 / 三级菜单”，并让三级页面可访问、可高亮且面包屑正确。

**Architecture:** 在 `src/router/routes.tsx` 中直接声明三级嵌套路由，菜单由现有 `routeToMenus` 从路由元数据派生。三级路由加载一个只渲染测试文本的简单页面；父级路由使用现有布局和 Outlet 机制承载子路由。

**Tech Stack:** React 19、TypeScript、React Router、Vitest、Testing Library、lucide-react。

## Global Constraints

- 三个菜单节点均显示，不设置 `showInMenu: false`。
- 菜单标题固定为“一级菜单”“二级菜单”“三级菜单”。
- 路径固定为 `/level-one/level-two/level-three`。
- 不新增接口、全局状态、权限限制或独立菜单配置。
- 页面只渲染简单测试文本，不加入额外业务逻辑。
- 不修改用户已有未提交文件。

---

### Task 1: 新增三级路由和页面

**Files:**

- Create: `src/pages/level-one/level-two/level-three.tsx`
- Modify: `src/router/routes.tsx`
- Create: `test/pages/level-one/level-three.test.tsx`

**Interfaces:**

- 路由树新增 `/level-one` → `level-two` → `level-three`。
- 三个路由分别使用唯一 `menuKey`：`level-one`、`level-two`、`level-three`。
- 三级路由加载 `@/pages/level-one/level-two/level-three`。
- 页面默认导出 React 组件，渲染文本 `三级菜单页面`。

- [ ] **Step 1: Write the failing test**

```tsx
it('访问三级菜单路径时渲染简单页面', async () => {
  const router = createMemoryRouter(buildRouter(routes), {
    initialEntries: ['/level-one/level-two/level-three'],
  })

  render(<RouterProvider router={router} />)

  expect(await screen.findByText('三级菜单页面')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm exec vitest run test/pages/level-one/level-three.test.tsx --reporter=dot`

Expected: FAIL，因为路由和页面尚不存在。

- [ ] **Step 3: Implement route and page**

新增页面：

```tsx
export default function LevelThree() {
  return <>三级菜单页面</>
}
```

在系统布局路由同级添加：

```tsx
{
  path: '/level-one',
  meta: { title: '一级菜单', menuKey: 'level-one' },
  children: [
    {
      path: 'level-two',
      meta: { title: '二级菜单', menuKey: 'level-two' },
      children: [
        {
          path: 'level-three',
          element: Lazy(() => import('@/pages/level-one/level-two/level-three')),
          meta: { title: '三级菜单', menuKey: 'level-three' },
        },
      ],
    },
  ],
}
```

该路由不设置 `showInMenu: false`，也不添加权限字段。

- [ ] **Step 4: Run focused test and verify it passes**

Run: `pnpm exec vitest run test/pages/level-one/level-three.test.tsx --reporter=dot`

Expected: PASS。

- [ ] **Step 5: Add menu and breadcrumb assertions**

在测试中调用 `routeToMenus(routes)`，断言结构：

```ts
expect(menus).toContainEqual({
  key: 'level-one',
  title: '一级菜单',
  path: '/level-one',
  children: [
    {
      key: 'level-two',
      title: '二级菜单',
      path: '/level-one/level-two',
      children: [
        {
          key: 'level-three',
          title: '三级菜单',
          path: '/level-one/level-two/level-three',
        },
      ],
    },
  ],
})
```

同时使用 `useMenuBreadcrumb` 验证：

```ts
expect(result.current).toEqual([
  { label: '一级菜单', href: '/level-one' },
  { label: '二级菜单', href: '/level-one/level-two' },
  { label: '三级菜单', href: undefined },
])
```

- [ ] **Step 6: Run focused and regression checks**

Run: `pnpm exec vitest run test/pages/level-one/level-three.test.tsx test/components/Menu.test.tsx test/components/useMenuBreadcrumb.test.ts --reporter=dot`

Expected: 所有测试通过。

Run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: TypeScript 和 ESLint 均通过。

- [ ] **Step 7: Commit**

```bash
git add src/router/routes.tsx src/pages/level-one/level-two/level-three.tsx test/pages/level-one/level-three.test.tsx
git commit -m "feat: 新增三级菜单示例页面

- 添加一级到三级的嵌套路由配置
- 展示三级菜单页面并保持菜单可见
- 验证菜单层级和面包屑导航关系"
```
