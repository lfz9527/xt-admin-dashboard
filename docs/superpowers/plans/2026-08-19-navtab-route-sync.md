# 导航标签路由联动实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让导航标签与路由自动联动：路由变化自动添加并激活标签，点击标签跳转路由，关闭标签时若关闭的是激活标签则跳转到相邻标签路由，只剩一个标签时不可关闭。

**Architecture:** 新增 `NavTabSync` 组件监听路由（`useLocation` + `useMatches`）同步标签；`NavTabProvider` 保持纯 context 不依赖路由；`NavTab` 组件使用 `useNavigate` 处理点击跳转和关闭跳转；`BaseLayout` 挂载 `NavTabSync`。

**Tech Stack:** React 19、TypeScript、React Router、Vitest、Testing Library。

## Global Constraints

- `Tab.id` 使用路由路径（`location.pathname`），同一路径只保留一个标签。
- 标签标题来自路由 `meta.title`，缺失时回退为路径。
- 所有标签 `closable` 默认 `true`，不添加首页固定逻辑。
- 只剩一个标签时不可关闭（沿用 `prev.length === 1` 保护与 `tabs.length > 1` 显示条件）。
- 关闭激活标签时激活前一个标签并跳转到其路由。
- `NavTabProvider` 保持纯 context，不依赖 react-router。
- 不新增全局状态、不持久化标签。
- 现有 NavTab 渲染测试需要包裹 `MemoryRouter`。

---

### Task 1: 新增 NavTabSync 并接入布局

**Files:**

- Create: `src/layout/NavTab/sync.tsx`
- Modify: `src/layout/baseLayout.tsx:17-19`
- Test: `test/components/NavTabSync.test.tsx`

**Interfaces:**

- 导出 `NavTabSync`：无 props，返回 `null`。
- 内部使用 `useLocation`、`useMatches`、`useNavTab`。
- 路由变化时 `addTab({ id: pathname, title })` + `setActiveTab(pathname)`。
- title 取自最后一个 match 的 `handle.title`，回退 `pathname`。

- [ ] **Step 1: Write the failing integration test**

使用真实 `routes` + `buildRouter` + `createMemoryRouter`，初始 `/`，断言“首页”标签出现并激活；`navigate('/dashboard/overview')` 后“概览”标签出现并激活。

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm exec vitest run test/components/NavTabSync.test.tsx --reporter=dot`

Expected: FAIL，`NavTabSync` 不存在。

- [ ] **Step 3: Implement NavTabSync**

```tsx
import { useEffect, useMemo } from 'react'
import { useLocation, useMatches } from 'react-router'
import { useNavTab } from './context'
import type { RouteMeta } from '@/router/types'

export function NavTabSync() {
  const location = useLocation()
  const matches = useMatches()
  const { addTab, setActiveTab } = useNavTab()

  const title = useMemo(() => {
    const currentMatch = matches[matches.length - 1]
    return (currentMatch?.handle as RouteMeta)?.title ?? location.pathname
  }, [matches, location.pathname])

  useEffect(() => {
    addTab({ id: location.pathname, title })
    setActiveTab(location.pathname)
  }, [location.pathname, title, addTab, setActiveTab])

  return null
}
```

在 `baseLayout.tsx` 的 `NavTabProvider` 内、`Main` 前挂载 `<NavTabSync />`。

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm exec vitest run test/components/NavTabSync.test.tsx --reporter=dot`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/layout/NavTab/sync.tsx src/layout/baseLayout.tsx test/components/NavTabSync.test.tsx
git commit -m "feat: 路由变化自动同步导航标签"
```

### Task 2: 标签点击跳转与关闭跳转

**Files:**

- Modify: `src/layout/NavTab/nav-tab.tsx`
- Modify: `test/components/NavTab.test.tsx`

**Interfaces:**

- `NavTab` 使用 `useNavigate`。
- 点击标签：`navigate(tab.id)`。
- 关闭按钮：非激活直接 `removeTab`；激活且 `tabs.length > 1` 时 `removeTab` 后跳转前一个标签路径。

- [ ] **Step 1: Update failing tests**

为现有渲染 `<NavTab />` 的测试包裹 `<MemoryRouter>`；将“点击标签页切换激活”改为验证路由跳转；新增“关闭激活标签后跳转前一个标签”测试。

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm exec vitest run test/components/NavTab.test.tsx --reporter=dot`

Expected: FAIL（`useNavigate` 需在 Router 内 / 点击行为断言不匹配）。

- [ ] **Step 3: Implement navigation behavior**

```tsx
const navigate = useNavigate()

// 点击标签
onClick={() => navigate(tab.id)}

// 关闭
function handleClose(id: string) {
  const idx = tabs.findIndex((t) => t.id === id)
  if (id === activeTabId && tabs.length > 1 && idx >= 0) {
    const remaining = tabs.filter((t) => t.id !== id)
    const nextIdx = Math.max(0, idx - 1)
    const next = remaining[Math.min(nextIdx, remaining.length - 1)]
    removeTab(id)
    navigate(next.id)
  } else {
    removeTab(id)
  }
}
```

- [ ] **Step 4: Run tests and verify pass**

Run: `pnpm exec vitest run test/components/NavTab.test.tsx test/components/NavTabSync.test.tsx --reporter=dot`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/layout/NavTab/nav-tab.tsx test/components/NavTab.test.tsx
git commit -m "feat: 标签点击跳转与关闭跳转相邻路由"
```

### Task 3: 回归验证

- [ ] **Step 1: Run full related tests**

Run: `pnpm exec vitest run test/components/NavTab.test.tsx test/components/NavTabSync.test.tsx test/components/Menu.test.tsx --reporter=dot`

Expected: 全部通过。

- [ ] **Step 2: Run type and lint checks**

Run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: 均通过。

- [ ] **Step 3: Run build**

Run: `pnpm build`

Expected: 构建成功（忽略既有 chunk size 警告）。
