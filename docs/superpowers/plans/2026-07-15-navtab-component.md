# NavTab 组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 NavTab 浏览器式多标签页组件的 UI 骨架，包含 context、hook 和标签栏 UI 组件。

**Architecture:** 遵循项目中 Sidebar 的 context 模式——Provider 管理状态并通过 context 分发，useNavTab hook 封装 useContext 并做 null-guard，NavTab 组件作为纯 UI 层消费 context。

**Tech Stack:** React 19 + TypeScript 5.9 + Tailwind CSS 4，复用项目已有的 `cn()` 工具函数。

## Global Constraints

- 遵循项目代码风格：无分号、单引号、trailingComma es5
- 类型导入使用 `import type`（`verbatimModuleSyntax`）
- 不允许 `enum`、`namespace`
- 组件文件使用函数组件，不引入 class 组件

---

### Task 1: NavTab context + useNavTab hook

**Files:**

- Create: `src/components/NavTab/context.tsx`

**Interfaces:**

- Produces: `Tab` 类型、`NavTabContextProps` 类型、`NavTabProvider` 组件、`useNavTab` hook

- [ ] **Step 1: 创建 context.tsx**

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface Tab {
  id: string
  title: string
  closable: boolean // 默认 true
}

export type NavTabContextProps = {
  tabs: Tab[]
  activeTabId: string | null
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
}

const NavTabContext = createContext<NavTabContextProps | null>(null)

export function useNavTab() {
  const context = useContext(NavTabContext)
  if (!context) {
    throw new Error('useNavTab must be used within a NavTabProvider.')
  }

  return context
}

export function NavTabProvider({
  children,
  defaultTabs = [],
  defaultActiveTabId = null,
}: {
  children: ReactNode
  defaultTabs?: Tab[]
  defaultActiveTabId?: string | null
}) {
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs)
  const [activeTabId, setActiveTabId] = useState<string | null>(
    defaultActiveTabId
  )

  const addTab = useCallback((tab: Tab) => {
    setTabs((prev) => {
      if (prev.some((t) => t.id === tab.id)) return prev
      return [...prev, { ...tab, closable: tab.closable ?? true }]
    })
    // React 18 自动批处理，setTabs 和 setActiveTabId 合并为一次渲染
    setActiveTabId(tab.id)
  }, [])

  const removeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target || !target.closable) return prev

      const remaining = prev.filter((t) => t.id !== id)

      setActiveTabId((prevActive) => {
        if (prevActive !== id) return prevActive
        if (remaining.length === 0) return null
        // 激活前一个标签页
        const idx = prev.findIndex((t) => t.id === id)
        const nextIdx = Math.max(0, idx - 1)
        return remaining[Math.min(nextIdx, remaining.length - 1)].id
      })

      return remaining
    })
  }, [])

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  const contextValue = useMemo<NavTabContextProps>(
    () => ({
      tabs,
      activeTabId,
      addTab,
      removeTab,
      setActiveTab,
    }),
    [tabs, activeTabId, addTab, removeTab, setActiveTab]
  )

  return (
    <NavTabContext.Provider value={contextValue}>
      {children}
    </NavTabContext.Provider>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/NavTab/context.tsx
git commit -m "feat: add NavTab context and useNavTab hook"
```

---

### Task 2: NavTab UI 组件

**Files:**

- Create: `src/components/NavTab/nav-tab.tsx`

**Interfaces:**

- Consumes: `useNavTab` from `./context`、`Tab` 类型
- Produces: `NavTab` 组件

- [ ] **Step 1: 创建 nav-tab.tsx**

```tsx
import { X } from 'lucide-react'
import { useNavTab } from './context'
import { cn } from '@/utils/common'

export function NavTab({ className, ...props }: React.ComponentProps<'div'>) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useNavTab()

  if (tabs.length === 0) return null

  return (
    <div
      data-slot='nav-tab'
      className={cn('flex items-center gap-0 border-b', className)}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            data-slot='nav-tab-item'
            data-active={isActive ? 'true' : 'false'}
            className={cn(
              'group/nav-tab-item relative flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors select-none',
              isActive
                ? 'border-primary text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className='max-w-40 truncate'>{tab.title}</span>
            {tab.closable && (
              <span
                data-slot='nav-tab-close'
                className={cn(
                  'hover:bg-muted-foreground/20 inline-flex size-4 items-center justify-center rounded-sm transition-opacity',
                  isActive
                    ? 'opacity-100'
                    : 'opacity-0 group-hover/nav-tab-item:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
              >
                <X className='size-3' />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/NavTab/nav-tab.tsx
git commit -m "feat: add NavTab UI component"
```

---

### Task 3: 统一导出

**Files:**

- Create: `src/components/NavTab/index.ts`

**Interfaces:**

- Consumes: `./context`、`./nav-tab`

- [ ] **Step 1: 创建 index.ts**

```ts
export { NavTabProvider, useNavTab } from './context'
export type { Tab, NavTabContextProps } from './context'
export { NavTab } from './nav-tab'
```

- [ ] **Step 2: 提交**

```bash
git add src/components/NavTab/index.ts
git commit -m "feat: add NavTab barrel export"
```

---

### Task 4: 测试

**Files:**

- Create: `test/components/NavTab.test.tsx`

**Interfaces:**

- Consumes: `NavTabProvider`、`useNavTab`、`NavTab` from `@/components/NavTab`

- [ ] **Step 1: 编写 context 测试**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { NavTabProvider, useNavTab, NavTab } from '@/components/NavTab'
import type { Tab } from '@/components/NavTab'

// 辅助组件：渲染 tabs 列表用于验证 context 状态
function TabListConsumer() {
  const { tabs, activeTabId } = useNavTab()
  return (
    <div>
      <span data-testid='active-id'>{activeTabId}</span>
      <span data-testid='tab-count'>{tabs.length}</span>
      <ul>
        {tabs.map((t) => (
          <li
            key={t.id}
            data-testid={`tab-${t.id}`}
          >
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('NavTabProvider + useNavTab', () => {
  it('不在 Provider 内使用时抛出错误', () => {
    function BadConsumer() {
      useNavTab()
      return null
    }
    expect(() => render(<BadConsumer />)).toThrow(
      'useNavTab must be used within a NavTabProvider.'
    )
  })

  it('addTab 新增标签页', () => {
    function Adder() {
      const { addTab, tabs, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => addTab({ id: '1', title: 'Tab 1' })}>
            Add
          </button>
          <span data-testid='active'>{activeTabId}</span>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider>
        <Adder />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('active').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('addTab 相同 id 不重复添加，只激活', () => {
    function Adder() {
      const { addTab, tabs } = useNavTab()
      return (
        <div>
          <button onClick={() => addTab({ id: '1', title: 'Tab 1' })}>
            Add
          </button>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider>
        <Adder />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Add'))
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('removeTab 关闭标签页', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    function Remover() {
      const { removeTab, tabs, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => removeTab('2')}>Remove</button>
          <span data-testid='active'>{activeTabId}</span>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='2'
      >
        <Remover />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Remove'))
    // 关闭的是当前激活的 tab，应激活前一个
    expect(screen.getByTestId('active').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('removeTab closable=false 不可关闭', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1', closable: false },
      { id: '2', title: 'Tab 2' },
    ]

    function Remover() {
      const { removeTab, tabs } = useNavTab()
      return (
        <div>
          <button onClick={() => removeTab('1')}>Remove</button>
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Remover />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Remove'))
    expect(screen.getByTestId('count').textContent).toBe('2')
  })

  it('setActiveTab 切换标签页', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    function Switcher() {
      const { setActiveTab, activeTabId } = useNavTab()
      return (
        <div>
          <button onClick={() => setActiveTab('2')}>Switch</button>
          <span data-testid='active'>{activeTabId}</span>
        </div>
      )
    }

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Switcher />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Switch'))
    expect(screen.getByTestId('active').textContent).toBe('2')
  })
})
```

- [ ] **Step 2: 运行 context 测试并确认通过**

```bash
pnpm vitest run test/components/NavTab.test.tsx
```

Expected: all 6 tests PASS

- [ ] **Step 3: 补充 NavTab UI 组件测试**

在 `test/components/NavTab.test.tsx` 中追加：

```tsx
describe('NavTab', () => {
  it('tabs 为空时不渲染任何内容', () => {
    const { container } = render(
      <NavTabProvider>
        <NavTab />
      </NavTabProvider>
    )
    expect(container.querySelector('[data-slot="nav-tab"]')).toBeNull()
  })

  it('渲染标签页标题', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <NavTab />
      </NavTabProvider>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('点击标签页切换激活', () => {
    // 使用 consumer 验证 activeTabId 变化
    function Page() {
      const { activeTabId } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='active'>{activeTabId}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Page />
      </NavTabProvider>
    )

    fireEvent.click(screen.getByText('Tab 2'))
    expect(screen.getByTestId('active').textContent).toBe('2')
  })

  it('关闭按钮点击触发 removeTab', () => {
    function Page() {
      const { tabs } = useNavTab()
      return (
        <div>
          <NavTab />
          <span data-testid='count'>{tabs.length}</span>
        </div>
      )
    }

    const defaultTabs: Tab[] = [
      { id: '1', title: 'Tab 1' },
      { id: '2', title: 'Tab 2' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <Page />
      </NavTabProvider>
    )

    const closeButtons = screen.getAllByText('', { selector: 'svg' })
    // 第一个 tab 的关闭按钮 (X icon)
    const tab1Close = screen
      .getByText('Tab 1')
      .closest('[data-slot="nav-tab-item"]')
      ?.querySelector('[data-slot="nav-tab-close"]')!

    fireEvent.click(tab1Close)
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('closable=false 不显示关闭按钮', () => {
    const defaultTabs: Tab[] = [
      { id: '1', title: 'Home', closable: false },
      { id: '2', title: 'Page' },
    ]

    render(
      <NavTabProvider
        defaultTabs={defaultTabs}
        defaultActiveTabId='1'
      >
        <NavTab />
      </NavTabProvider>
    )

    const items = document.querySelectorAll('[data-slot="nav-tab-item"]')
    const homeItem = items[0]
    const pageItem = items[1]

    expect(homeItem.querySelector('[data-slot="nav-tab-close"]')).toBeNull()
    expect(pageItem.querySelector('[data-slot="nav-tab-close"]')).not.toBeNull()
  })
})
```

- [ ] **Step 4: 运行全部测试并确认通过**

```bash
pnpm vitest run test/components/NavTab.test.tsx
```

Expected: all 10 tests PASS

- [ ] **Step 5: 提交**

```bash
git add test/components/NavTab.test.tsx
git commit -m "test: add NavTab context and UI tests"
```
