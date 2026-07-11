# Header 面包屑菜单数据驱动 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Header 面包屑从硬编码改为根据当前路由 menuKey + 菜单树动态生成

**Architecture:** 新增 `useMenuBreadcrumb` hook 放在 Breadcrumb 组件目录内，DFS 遍历菜单树查找 menuKey 对应的节点路径，映射为 `BreadcrumbItemData[]`。Header 层删掉硬编码数据，调用 hook 获取动态面包屑项。

**Tech Stack:** React 19, TypeScript 5.9, React Router 7, Zustand 5

## Global Constraints

- 类型导入必须使用 `import type`（`verbatimModuleSyntax: true`）
- 新增 hook 不导出到 `@/hooks`，随 Breadcrumb 组件一起导出
- 测试文件放在 `test/components/` 下
- 提交采用 `feat:` 类型，中文 commit message

---

### Task 1: 创建 `useMenuBreadcrumb` hook

**Files:**

- Create: `src/components/Breadcrumb/useMenuBreadcrumb.ts`
- Modify: `src/components/Breadcrumb/index.tsx`

**Interfaces:**

- Consumes: `MenuItem` from `@/components/Menu/types`, `BreadcrumbItemData` from `./breadcrumb`
- Produces: `useMenuBreadcrumb(menus: MenuItem[], menuKey: string, fallbackTitle?: string): BreadcrumbItemData[]`

- [ ] **Step 1: 创建 hook 文件**

`src/components/Breadcrumb/useMenuBreadcrumb.ts`:

```typescript
import { useMemo } from 'react'
import type { MenuItem } from '@/components/Menu/types'
import type { BreadcrumbItemData } from './breadcrumb'

/**
 * DFS 在菜单树中查找 menuKey 对应的节点，返回从根到该节点的 BreadcrumbItemData 数组。
 * 找不到时退回 fallbackTitle 单一项。
 */
function findMenuPath(menus: MenuItem[], targetKey: string): MenuItem[] | null {
  for (const item of menus) {
    if (item.key === targetKey) {
      return [item]
    }
    if (item.children?.length) {
      const found = findMenuPath(item.children, targetKey)
      if (found) {
        return [item, ...found]
      }
    }
  }
  return null
}

function menuPathToBreadcrumb(path: MenuItem[]): BreadcrumbItemData[] {
  return path.map((item, index) => {
    const isLast = index === path.length - 1
    return {
      label: item.title,
      // 末节点不传 href，渲染为当前页文本不可点击
      href: isLast ? undefined : item.path,
    }
  })
}

export function useMenuBreadcrumb(
  menus: MenuItem[],
  menuKey: string,
  fallbackTitle?: string
): BreadcrumbItemData[] {
  return useMemo(() => {
    if (!menuKey) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }
    const path = findMenuPath(menus, menuKey)
    if (!path) {
      return fallbackTitle ? [{ label: fallbackTitle }] : []
    }
    return menuPathToBreadcrumb(path)
  }, [menus, menuKey, fallbackTitle])
}
```

- [ ] **Step 2: 从 Breadcrumb index 导出 hook**

`src/components/Breadcrumb/index.tsx`，在已有导出后追加:

```typescript
export { useMenuBreadcrumb } from './useMenuBreadcrumb'
```

完整文件变为:

```typescript
export { Breadcrumb } from './breadcrumb'
export type { BreadcrumbItemData, BreadcrumbProps } from './breadcrumb'
export { useMenuBreadcrumb } from './useMenuBreadcrumb'
```

- [ ] **Step 3: TypeScript 类型检查**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -20
```

预期: 无新增错误（仅有预先存在的 `context.tsx` 警告）。

- [ ] **Step 4: Commit**

```bash
git add src/components/Breadcrumb/useMenuBreadcrumb.ts src/components/Breadcrumb/index.tsx
git commit -m "feat: 新增 useMenuBreadcrumb hook，从菜单树 DFS 查找路径生成面包屑数据"
```

---

### Task 2: 编写 `useMenuBreadcrumb` 测试

**Files:**

- Create: `test/components/useMenuBreadcrumb.test.ts`

**Interfaces:**

- Consumes: `useMenuBreadcrumb` from `@/components/Breadcrumb/useMenuBreadcrumb`

- [ ] **Step 1: 编写测试文件**

`test/components/useMenuBreadcrumb.test.ts`:

```typescript
import { renderHook } from '@testing-library/react'
import { useMenuBreadcrumb } from '@/components/Breadcrumb/useMenuBreadcrumb'
import type { MenuItem } from '@/components/Menu/types'

// 模拟菜单树：系统管理 > 角色管理 > 三级菜单
const mockMenus: MenuItem[] = [
  { key: 'home', title: '首页', path: '/' },
  {
    key: 'system',
    title: '系统管理',
    path: '/system',
    children: [
      { key: 'system-users', title: '用户管理', path: '/system/users' },
      {
        key: 'system-roles',
        title: '角色管理',
        path: '/system/roles',
        children: [
          {
            key: 'system-roles-detail',
            title: '三级菜单',
            path: '/system/roles/detail',
          },
        ],
      },
    ],
  },
]

describe('useMenuBreadcrumb', () => {
  it('应返回完整菜单路径（多级嵌套）', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, 'system-roles-detail')
    )

    expect(result.current).toEqual([
      { label: '系统管理', href: '/system' },
      { label: '角色管理', href: '/system/roles' },
      { label: '三级菜单', href: undefined },
    ])
  })

  it('应返回单层路径（顶级菜单项）', () => {
    const { result } = renderHook(() => useMenuBreadcrumb(mockMenus, 'home'))

    expect(result.current).toEqual([{ label: '首页', href: undefined }])
  })

  it('menuKey 在菜单树中不存在时应退回 fallbackTitle', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, 'non-existent', '404')
    )

    expect(result.current).toEqual([{ label: '404', href: undefined }])
  })

  it('menuKey 为空字符串且无 fallbackTitle 时返回空数组', () => {
    const { result } = renderHook(() => useMenuBreadcrumb(mockMenus, ''))

    expect(result.current).toEqual([])
  })

  it('menuKey 为空字符串但有 fallbackTitle 时退回单一项', () => {
    const { result } = renderHook(() =>
      useMenuBreadcrumb(mockMenus, '', '登录')
    )

    expect(result.current).toEqual([{ label: '登录', href: undefined }])
  })

  it('菜单节点无 path 时 href 为 undefined', () => {
    const menusWithoutPath: MenuItem[] = [
      {
        key: 'container',
        title: '容器',
        children: [{ key: 'leaf', title: '叶子', path: '/leaf' }],
      },
    ]

    const { result } = renderHook(() =>
      useMenuBreadcrumb(menusWithoutPath, 'leaf')
    )

    expect(result.current).toEqual([
      { label: '容器', href: undefined },
      { label: '叶子', href: undefined },
    ])
  })

  it('menus 为空数组时退回 fallbackTitle', () => {
    const { result } = renderHook(() => useMenuBreadcrumb([], 'home', '首页'))

    expect(result.current).toEqual([{ label: '首页', href: undefined }])
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
pnpm vitest run test/components/useMenuBreadcrumb.test.ts
```

预期: 全部 7 条测试 PASS。

- [ ] **Step 3: Commit**

```bash
git add test/components/useMenuBreadcrumb.test.ts
git commit -m "test: 新增 useMenuBreadcrumb hook 单元测试"
```

---

### Task 3: 改造 Header 组件，接入动态面包屑

**Files:**

- Modify: `src/components/Header/index.tsx`

**Interfaces:**

- Consumes: `useMenuBreadcrumb` from `@/components/Breadcrumb`, `useMenu` from `@/store`, `useMatches` from `react-router`

- [ ] **Step 1: 修改 Header 组件**

`src/components/Header/index.tsx` 替换为:

```typescript
import { Moon, Sun } from 'lucide-react'
import { useMatches } from 'react-router'
import { SidebarTrigger } from '@/ui/Sidebar'
import { Button } from '@/ui/Button'
import { useTheme, useIsMobile } from '@/hooks'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useMenuBreadcrumb } from '@/components/Breadcrumb'
import { useMenu } from '@/store'
import { Separator } from '@/ui/Separator'
import type { RouteMeta } from '@/router/types'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useIsMobile()
  const menus = useMenu((s) => s.menus)

  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const menuKey = (currentMatch?.handle as RouteMeta)?.menuKey ?? ''
  const routeTitle = (currentMatch?.handle as RouteMeta)?.title

  const breadcrumbItems = useMenuBreadcrumb(menus, menuKey, routeTitle)

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full justify-between gap-2 px-2'>
        <div className='flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600'>
          <SidebarTrigger />
          {!isMobile && (
            <>
              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:self-auto data-[orientation=vertical]:h-4'
              />
              <Breadcrumb
                items={breadcrumbItems}
                maxItems={4}
                startCount={1}
                endCount={2}
                ellipsisDropdownItem={(item) => ({
                  label: item.label,
                  onClick: item.href
                    ? () => console.log('navigate to:', item.href)
                    : undefined,
                })}
              />
            </>
          )}
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -20
```

预期: 无新增错误。

- [ ] **Step 3: ESLint 检查**

```bash
pnpm lint
```

预期: 无报错。

- [ ] **Step 4: 运行全部测试**

```bash
pnpm test
```

预期: 仅预先存在的失败，无新增失败。

- [ ] **Step 5: Commit**

```bash
git add src/components/Header/index.tsx
git commit -m "feat: Header 面包屑接入 useMenuBreadcrumb 动态生成，移除硬编码数据"
```

---

### Task 4: 端到端验证

**Files:**

- 无新建或修改文件

- [ ] **Step 1: 启动开发服务器验证**

```bash
pnpm dev
```

手动验证:

- 访问 `/`（首页）→ 面包屑显示"首页"
- 访问 `/system/users`（用户管理）→ 面包屑显示"系统管理 > 用户管理"
- 访问 `/system/roles/detail`（三级菜单）→ 面包屑显示"系统管理 > 角色管理 > 三级菜单"
- 访问 `/login` → 面包屑显示"登陆"
- 移动端视口 → 面包屑隐藏（仅汉堡菜单）

- [ ] **Step 2: 构建验证**

```bash
pnpm build
```

预期: 构建成功，无类型错误。
