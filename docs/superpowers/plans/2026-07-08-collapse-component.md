# Collapse 组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 `src/ui/Collapsible/` 封装数据驱动的折叠面板组 `Collapse` 组件

**Architecture:** 单一组件文件 `collapse.tsx`，内部用 `useState` 管理非受控展开状态，通过 `open`/`onOpenChange` 控制每个 `Collapsible` 子项。受控模式下外部通过 `openKeys`/`onToggle` 接管状态。手风琴模式下展开新项时自动关闭其他项。

**Tech Stack:** React 19 + TypeScript 5.9 + @base-ui/react/collapsible + Vitest + @testing-library/react

## 全局约束

- `verbatimModuleSyntax: true` — 类型导入必须使用 `import type`
- `jsx: "react-jsx"` — 无需显式 `import React`
- 测试文件放在 `test/components/Collapse.test.tsx`
- 遵循项目 Prettier 配置：无分号、单引号、`singleAttributePerLine: true`

---

### Task 1: 创建组件文件与类型定义

**Files:**

- Create: `src/components/Collapse/collapse.tsx`
- Create: `src/components/Collapse/index.ts`

**Interfaces:**

- Produces: `CollapseItem` 类型, `CollapseProps` 类型, `Collapse` 组件

- [ ] **Step 1: 创建 collapse.tsx**

```tsx
import { useState, useCallback } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/Collapsible'

interface CollapseItem {
  key: string
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
}

interface CollapseProps {
  items: CollapseItem[]
  type?: 'multiple' | 'accordion'
  openKeys?: string[]
  defaultOpenKeys?: string[]
  onToggle?: (key: string, open: boolean) => void
}

function Collapse({
  items,
  type = 'multiple',
  openKeys,
  defaultOpenKeys,
  onToggle,
}: CollapseProps) {
  const isControlled = openKeys !== undefined

  const [internalOpenKeys, setInternalOpenKeys] = useState<string[]>(() => {
    if (isControlled) return []
    const set = new Set(defaultOpenKeys ?? [])
    for (const item of items) {
      if (item.defaultOpen) set.add(item.key)
    }
    return [...set]
  })

  const currentOpenKeys = isControlled ? openKeys : internalOpenKeys

  const handleOpenChange = useCallback(
    (key: string, open: boolean) => {
      const item = items.find((i) => i.key === key)
      if (!item) return

      if (!open && item.disabled && item.defaultOpen) return
      if (open && item.disabled) return

      if (isControlled) {
        onToggle?.(key, open)
        return
      }

      setInternalOpenKeys((prev) => {
        if (open) {
          return type === 'accordion' ? [key] : [...prev, key]
        }
        return prev.filter((k) => k !== key)
      })
    },
    [items, isControlled, onToggle, type]
  )

  return (
    <>
      {items.map((item) => (
        <Collapsible
          key={item.key}
          open={currentOpenKeys.includes(item.key)}
          onOpenChange={(open) => handleOpenChange(item.key, open)}
        >
          <CollapsibleTrigger>{item.title}</CollapsibleTrigger>
          <CollapsibleContent>{item.children}</CollapsibleContent>
        </Collapsible>
      ))}
    </>
  )
}

export { Collapse }
export type { CollapseItem, CollapseProps }
```

- [ ] **Step 2: 创建 index.ts**

```ts
export { Collapse } from './collapse'
export type { CollapseItem, CollapseProps } from './collapse'
```

- [ ] **Step 3: 提交**

```bash
git add src/components/Collapse/
git commit -m "feat: add Collapse component with types"
```

---

### Task 2: 非受控模式测试

**Files:**

- Create: `test/components/Collapse.test.tsx`

**Interfaces:**

- Consumes: `Collapse` from `@/components/Collapse`
- Produces: 非受控模式测试用例

- [ ] **Step 1: 编写非受控模式测试**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Collapse } from '@/components/Collapse'

const sampleItems = [
  { key: 'a', title: '标题A', children: '内容A' },
  { key: 'b', title: '标题B', children: '内容B' },
  { key: 'c', title: '标题C', children: '内容C' },
]

describe('Collapse - 非受控模式', () => {
  it('渲染所有 item 的 title', () => {
    render(<Collapse items={sampleItems} />)
    expect(screen.getByText('标题A')).toBeInTheDocument()
    expect(screen.getByText('标题B')).toBeInTheDocument()
    expect(screen.getByText('标题C')).toBeInTheDocument()
  })

  it('默认所有面板收起，content 不可见', () => {
    render(<Collapse items={sampleItems} />)
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()
  })

  it('点击 title 展开对应面板，content 可见', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('点击已展开的 title 收起面板', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('defaultOpen 项初始展开', () => {
    const items = [
      { key: 'a', title: 'A', children: '内容A', defaultOpen: true },
      { key: 'b', title: 'B', children: '内容B' },
    ]
    render(<Collapse items={items} />)
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()
  })

  it('defaultOpenKeys 指定初始展开', () => {
    render(
      <Collapse
        items={sampleItems}
        defaultOpenKeys={['b']}
      />
    )
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('独立模式下多个面板可同时展开', () => {
    render(<Collapse items={sampleItems} />)
    fireEvent.click(screen.getByText('标题A'))
    fireEvent.click(screen.getByText('标题B'))
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认通过**

```bash
pnpm vitest run test/components/Collapse.test.tsx
```

Expected: 7 tests PASS

- [ ] **Step 3: 提交**

```bash
git add test/components/Collapse.test.tsx
git commit -m "test: add uncontrolled mode tests for Collapse"
```

---

### Task 3: 手风琴模式测试与实现验证

**Files:**

- Modify: `test/components/Collapse.test.tsx` — 追加手风琴测试

**Interfaces:**

- Consumes: `Collapse` type="accordion"

- [ ] **Step 1: 追加手风琴模式测试**

在 `test/components/Collapse.test.tsx` 的 `describe` 块后追加：

```tsx
describe('Collapse - 手风琴模式', () => {
  it('同一时间只有一个面板展开', () => {
    render(
      <Collapse
        items={sampleItems}
        type='accordion'
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.getByText('内容A')).toBeInTheDocument()

    fireEvent.click(screen.getByText('标题B'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('点击已展开的面板可收起', () => {
    render(
      <Collapse
        items={sampleItems}
        type='accordion'
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    fireEvent.click(screen.getByText('标题A'))
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
  })

  it('手风琴模式下 defaultOpen 多个时只展开第一个', () => {
    const items = [
      { key: 'a', title: 'A', children: 'A内容', defaultOpen: true },
      { key: 'b', title: 'B', children: 'B内容', defaultOpen: true },
      { key: 'c', title: 'C', children: 'C内容' },
    ]
    render(
      <Collapse
        items={items}
        type='accordion'
      />
    )
    // 手风琴模式：后处理的 defaultOpen 覆盖前者，最终只有一项展开
    // items 顺序处理，key='b' 的 defaultOpen 覆盖 key='a'，所以只有 'b' 展开
    expect(screen.queryByText('A内容')).not.toBeInTheDocument()
    expect(screen.getByText('B内容')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认通过**

```bash
pnpm vitest run test/components/Collapse.test.tsx
```

Expected: 10 tests PASS

- [ ] **Step 3: 提交**

```bash
git add test/components/Collapse.test.tsx
git commit -m "test: add accordion mode tests for Collapse"
```

---

### Task 4: 受控模式测试

**Files:**

- Modify: `test/components/Collapse.test.tsx` — 追加受控测试

- [ ] **Step 1: 追加受控模式测试**

在文件末尾追加：

```tsx
describe('Collapse - 受控模式', () => {
  it('openKeys 控制展开状态', () => {
    const { rerender } = render(
      <Collapse
        items={sampleItems}
        openKeys={['a']}
      />
    )
    expect(screen.getByText('内容A')).toBeInTheDocument()
    expect(screen.queryByText('内容B')).not.toBeInTheDocument()

    rerender(
      <Collapse
        items={sampleItems}
        openKeys={['b']}
      />
    )
    expect(screen.queryByText('内容A')).not.toBeInTheDocument()
    expect(screen.getByText('内容B')).toBeInTheDocument()
  })

  it('受控模式下点击触发 onToggle 而非内部状态变更', () => {
    const onToggle = vi.fn()
    render(
      <Collapse
        items={sampleItems}
        openKeys={['a']}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(onToggle).toHaveBeenCalledWith('a', false)
    // 外部未更新 openKeys，内容仍可见
    expect(screen.getByText('内容A')).toBeInTheDocument()
  })

  it('受控模式下 onToggle 展开新面板', () => {
    const onToggle = vi.fn()
    render(
      <Collapse
        items={sampleItems}
        openKeys={[]}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByText('标题A'))
    expect(onToggle).toHaveBeenCalledWith('a', true)
  })
})
```

- [ ] **Step 2: 运行测试确认通过**

```bash
pnpm vitest run test/components/Collapse.test.tsx
```

Expected: 13 tests PASS

- [ ] **Step 3: 提交**

```bash
git add test/components/Collapse.test.tsx
git commit -m "test: add controlled mode tests for Collapse"
```

---

### Task 5: disabled 行为测试

**Files:**

- Modify: `test/components/Collapse.test.tsx` — 追加 disabled 测试

- [ ] **Step 1: 追加 disabled 测试**

在文件末尾追加：

```tsx
describe('Collapse - disabled', () => {
  it('disabled 项禁止从收起状态展开', () => {
    const items = [{ key: 'a', title: 'A', children: 'A内容', disabled: true }]
    render(<Collapse items={items} />)
    fireEvent.click(screen.getByText('A'))
    expect(screen.queryByText('A内容')).not.toBeInTheDocument()
  })

  it('disabled + defaultOpen 项禁止收起', () => {
    const items = [
      {
        key: 'a',
        title: 'A',
        children: 'A内容',
        disabled: true,
        defaultOpen: true,
      },
    ]
    render(<Collapse items={items} />)
    expect(screen.getByText('A内容')).toBeInTheDocument()
    fireEvent.click(screen.getByText('A'))
    // 仍然展开
    expect(screen.getByText('A内容')).toBeInTheDocument()
  })

  it('disabled 但非 defaultOpen 的已展开项可收起', () => {
    // disabled 仅禁止展开，不禁止收起（除非同时有 defaultOpen）
    const items = [
      {
        key: 'a',
        title: 'A',
        children: 'A内容',
        disabled: true,
        defaultOpen: true,
      },
      { key: 'b', title: 'B', children: 'B内容', disabled: true },
    ]
    render(
      <Collapse
        items={items}
        openKeys={['a', 'b']}
      />
    )
    // item 'a': disabled + defaultOpen → 禁止收起
    // item 'b': disabled → 仅禁止展开，可收起
    fireEvent.click(screen.getByText('B'))
    expect(screen.queryByText('B内容')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认通过**

```bash
pnpm vitest run test/components/Collapse.test.tsx
```

Expected: 16 tests PASS

- [ ] **Step 3: 提交**

```bash
git add test/components/Collapse.test.tsx
git commit -m "test: add disabled behavior tests for Collapse"
```

---

### Task 6: README 文档

**Files:**

- Create: `src/components/Collapse/README.md`

- [ ] **Step 1: 创建 README.md**

````markdown
# Collapse

数据驱动的折叠面板组组件，基于 `ui/Collapsible` 封装。

## CollapseItem

| 字段          | 类型        | 必填 | 说明                                           |
| ------------- | ----------- | ---- | ---------------------------------------------- |
| `key`         | `string`    | 是   | 唯一标识                                       |
| `title`       | `ReactNode` | 是   | 触发器内容                                     |
| `children`    | `ReactNode` | 是   | 折叠内容                                       |
| `defaultOpen` | `boolean`   | 否   | 初始展开状态（非受控模式）                     |
| `disabled`    | `boolean`   | 否   | 禁止展开；若同时 `defaultOpen=true` 则禁止收起 |

## CollapseProps

| 属性              | 类型                                   | 默认值       | 说明                        |
| ----------------- | -------------------------------------- | ------------ | --------------------------- |
| `items`           | `CollapseItem[]`                       | —            | 数据数组                    |
| `type`            | `'multiple' \| 'accordion'`            | `'multiple'` | 展开模式                    |
| `openKeys`        | `string[]`                             | —            | 受控：当前展开的 key 列表   |
| `defaultOpenKeys` | `string[]`                             | —            | 非受控：初始展开的 key 列表 |
| `onToggle`        | `(key: string, open: boolean) => void` | —            | 受控模式回调                |

## 使用示例

### 默认独立模式

```tsx
import { Collapse } from '@/components/Collapse'

const items = [
  { key: '1', title: '标题一', children: '内容一' },
  { key: '2', title: '标题二', children: '内容二', defaultOpen: true },
]

<Collapse items={items} />
```
````

### 手风琴模式

```tsx
<Collapse
  items={items}
  type='accordion'
/>
```

### 受控模式

```tsx
const [openKeys, setOpenKeys] = useState<string[]>([])

<Collapse
  items={items}
  openKeys={openKeys}
  onToggle={(key, open) => {
    setOpenKeys(open ? [...openKeys, key] : openKeys.filter(k => k !== key))
  }}
/>
```

### disabled 行为

```tsx
const items = [
  { key: 'a', title: '普通项', children: '内容' },
  { key: 'b', title: '禁止展开', children: '内容', disabled: true },
  { key: 'c', title: '始终展开', children: '内容', disabled: true, defaultOpen: true },
]

<Collapse items={items} />
```

````

- [ ] **Step 2: 提交**

```bash
git add src/components/Collapse/README.md
git commit -m "docs: add README for Collapse component"
````

---

### Task 7: 最终验证

- [ ] **Step 1: 运行全部测试**

```bash
pnpm vitest run test/components/Collapse.test.tsx
```

Expected: 16 tests PASS

- [ ] **Step 2: TypeScript 类型检查**

```bash
pnpm tsc --noEmit
```

Expected: no errors related to Collapse

- [ ] **Step 3: ESLint 检查**

```bash
pnpm lint
```

Expected: no errors
