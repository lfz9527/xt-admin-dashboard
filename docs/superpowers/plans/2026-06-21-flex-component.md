# Flex 布局组件 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个声明式 Flex 布局组件，将 CSS Flexbox 属性映射为 Tailwind CSS 4 类名。

**Architecture:** 单个 React 函数组件 `Flex`，接收 flexbox 相关 props，拼接 Tailwind 类名到容器 `<div>` 上。`flex` prop 通过 `[&>*]:flex-*` Tailwind 变体注入到所有直接子元素。`center` 快捷属性覆盖 `align`/`justify`。

**Tech Stack:** React 19 + TypeScript 5.9 + Tailwind CSS 4 + Vitest + @testing-library/react

## Global Constraints

- 组件文件放在 `src/components/Flex/index.tsx`
- 测试文件放在 `test/components/Flex.test.tsx`
- 默认导出函数组件，类型定义内联
- 测试使用 vitest globals（`describe`/`it`/`expect` 无需 import）
- 遵循项目现有代码风格（ESLint + Prettier）

---

### Task 1: 实现 Flex 组件（TDD）

**Files:**

- Create: `src/components/Flex/index.tsx`
- Create: `test/components/Flex.test.tsx`

**Interfaces:**

- Produces: `Flex` 组件，接收 `FlexProps` 类型

- [ ] **Step 1: 编写测试文件**

`test/components/Flex.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Flex from '@/components/Flex'

function getContainer(ui: React.ReactElement) {
  const { container } = render(ui)
  return container.firstElementChild as HTMLElement
}

describe('Flex', () => {
  it('默认渲染 flex 容器', () => {
    const el = getContainer(
      <Flex>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex')
  })

  it('vertical 添加 flex-col', () => {
    const el = getContainer(
      <Flex vertical>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex-col')
  })

  it('align 映射到 items-*', () => {
    const el = getContainer(
      <Flex align='center'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
  })

  it('justify 映射到 justify-*', () => {
    const el = getContainer(
      <Flex justify='between'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('justify-between')
  })

  it('wrap 映射到 flex-wrap', () => {
    const el = getContainer(
      <Flex wrap='wrap'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('flex-wrap')
  })

  it('gap 映射到 gap-N', () => {
    const el = getContainer(
      <Flex gap={4}>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('gap-4')
  })

  it('center 快捷设置 items-center justify-center', () => {
    const el = getContainer(
      <Flex center>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
    expect(el.className).toContain('justify-center')
  })

  it('center 覆盖 align 和 justify 的值', () => {
    const el = getContainer(
      <Flex
        center
        align='start'
        justify='between'
      >
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('items-center')
    expect(el.className).toContain('justify-center')
    expect(el.className).not.toContain('items-start')
    expect(el.className).not.toContain('justify-between')
  })

  it('flex={1} 给直接子元素添加 [&>*]:flex-1', () => {
    const el = getContainer(
      <Flex flex={1}>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-1')
  })

  it('flex="auto" 给直接子元素添加 [&>*]:flex-auto', () => {
    const el = getContainer(
      <Flex flex='auto'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('[&>*]:flex-auto')
  })

  it('className 合并到容器', () => {
    const el = getContainer(
      <Flex className='custom'>
        <span>a</span>
      </Flex>
    )
    expect(el.className).toContain('custom')
    expect(el.className).toContain('flex')
  })

  it('style 传递给容器', () => {
    const el = getContainer(
      <Flex style={{ padding: 8 }}>
        <span>a</span>
      </Flex>
    )
    expect(el.style.padding).toBe('8px')
  })

  it('渲染子元素', () => {
    render(
      <Flex>
        <span>hello</span>
      </Flex>
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

```bash
pnpm test -- run test/components/Flex.test.tsx
```

预期: 所有测试 FAIL — 组件文件不存在。

- [ ] **Step 3: 编写 Flex 组件实现**

`src/components/Flex/index.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
type Wrap = 'wrap' | 'nowrap' | 'wrap-reverse'
type FlexValue = number | 'auto' | 'none' | 'initial'

type FlexProps = {
  vertical?: boolean
  align?: Align
  justify?: Justify
  wrap?: Wrap
  gap?: number
  flex?: FlexValue
  center?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

const alignMap: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyMap: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

const wrapMap: Record<Wrap, string> = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

const flexChildMap: Record<string, string> = {
  '1': '[&>*]:flex-1',
  auto: '[&>*]:flex-auto',
  none: '[&>*]:flex-none',
  initial: '[&>*]:flex-initial',
}

function Flex({
  vertical,
  align,
  justify,
  wrap,
  gap,
  flex,
  center,
  className,
  style,
  children,
}: FlexProps) {
  const classes: string[] = ['flex']

  if (vertical) classes.push('flex-col')

  if (center) {
    classes.push('items-center', 'justify-center')
  } else {
    if (align) classes.push(alignMap[align])
    if (justify) classes.push(justifyMap[justify])
  }

  if (wrap) classes.push(wrapMap[wrap])
  if (gap !== undefined) classes.push(`gap-${gap}`)
  if (flex !== undefined) classes.push(flexChildMap[String(flex)])
  if (className) classes.push(className)

  return (
    <div
      className={classes.join(' ')}
      style={style}
    >
      {children}
    </div>
  )
}

export default Flex
```

- [ ] **Step 4: 运行测试验证通过**

```bash
pnpm test -- run test/components/Flex.test.tsx
```

预期: 12 个测试全部 PASS。

- [ ] **Step 5: 运行 ESLint 和 Prettier 检查**

```bash
pnpm lint:fix
pnpm format
```

预期: 无 lint 错误，代码格式化通过。

- [ ] **Step 6: 提交**

```bash
git add src/components/Flex/index.tsx test/components/Flex.test.tsx
git commit -m "feat: 添加 Flex 布局组件"
```
