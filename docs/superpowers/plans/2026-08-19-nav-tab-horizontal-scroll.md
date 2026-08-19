# NavTab 横向滚动实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用现有 `ScrollArea` 为导航 Tab 提供横向滚动条，并在激活或新增 Tab 后自动滚动到可见区域。

**Architecture:** 在 `NavTab` 中引入 `ScrollArea` 和横向 `ScrollBar`，让 viewport 承载可横向扩展的 Tab 内容。保留 pill 在内容容器内的绝对定位，使其随内容一起滚动；通过每个 Tab 的 ref，在激活状态或 tabs 列表变化后调用 `scrollIntoView({ inline: 'nearest' })`。

**Tech Stack:** React 19、TypeScript、Base UI ScrollArea、Tailwind CSS、Vitest、Testing Library。

## Global Constraints

- 仅修改实现横向滚动和自动可见行为所需的文件，不重构无关 NavTab 逻辑。
- 复用 `src/ui/ScrollArea/index.tsx`，不新增滚动组件或依赖。
- 继续使用 `@/*` 映射导入和现有 Tailwind 样式约定。
- 保留 tabs 为空时不渲染、Tab 切换、关闭按钮及 pill 高亮行为。
- 修改后运行相关 Vitest 测试、`pnpm lint` 和 `pnpm build`。

---

### Task 1: 为 NavTab 增加滚动行为测试

**Files:**

- Modify: `test/components/NavTab.test.tsx:160-276`

**Interfaces:**

- Consumes: `NavTab`、`NavTabProvider` 和 `Tab` 现有接口。
- Produces: 对横向 `ScrollArea` 结构及激活 Tab 自动调用 `scrollIntoView` 的回归测试。

- [ ] **Step 1: 写失败测试，验证横向滚动条存在且 Tab 内容可滚动**

在 `describe('NavTab', ...)` 中增加测试，渲染两个 Tab 后断言存在 `[data-slot="scroll-area"]`、`[data-slot="scroll-area-viewport"]` 和 `[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]`。由于 `ScrollArea` 基于 Base UI，测试只验证公开 data-slot/data-orientation 标记，不依赖内部 DOM 细节。

```tsx
it('使用 ScrollArea 提供横向滚动区域', () => {
  render(
    <NavTabProvider
      defaultTabs={[
        { id: '1', title: 'Tab 1' },
        { id: '2', title: 'Tab 2' },
      ]}
      defaultActiveTabId='1'
    >
      <NavTab />
    </NavTabProvider>
  )

  expect(
    document.querySelector('[data-slot="scroll-area"]')
  ).toBeInTheDocument()
  expect(
    document.querySelector('[data-slot="scroll-area-viewport"]')
  ).toBeInTheDocument()
  expect(
    document.querySelector(
      '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
    )
  ).toBeInTheDocument()
})
```

- [ ] **Step 2: 写失败测试，验证切换激活 Tab 时自动滚动**

在测试文件顶部引入 `vi`，在测试中对 `Element.prototype.scrollIntoView` 建立 spy；点击第二个 Tab 后断言第二个 Tab 的 DOM 节点被传入 `scrollIntoView`，并使用 `{ inline: 'nearest' }`。

```tsx
it('切换激活 Tab 后自动滚动到可见区域', () => {
  const scrollIntoView = vi
    .spyOn(Element.prototype, 'scrollIntoView')
    .mockImplementation(() => {})

  render(
    <NavTabProvider
      defaultTabs={[
        { id: '1', title: 'Tab 1' },
        { id: '2', title: 'Tab 2' },
      ]}
      defaultActiveTabId='1'
    >
      <NavTab />
    </NavTabProvider>
  )

  fireEvent.click(screen.getByText('Tab 2'))

  expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'nearest' })
  expect(scrollIntoView.mock.instances).toContain(
    screen.getByText('Tab 2').closest('[data-slot="nav-tab-item"]')
  )
  scrollIntoView.mockRestore()
})
```

- [ ] **Step 3: 运行新增测试确认当前实现失败**

Run: `pnpm test -- test/components/NavTab.test.tsx`

Expected: 新增 ScrollArea 结构断言失败；自动滚动断言失败或未调用 `scrollIntoView`。

### Task 2: 在 NavTab 中接入 ScrollArea 与自动滚动

**Files:**

- Modify: `src/layout/NavTab/nav-tab.tsx:1-110`

**Interfaces:**

- Consumes: `ScrollArea`、`ScrollBar` 的现有导出；现有 `tabs`、`activeTabId`、`setActiveTab`、`removeTab`。
- Produces: 使用 `data-slot='scroll-area'` 的横向滚动 NavTab，并在激活 Tab 变更后调用当前 Tab 的 `scrollIntoView`。

- [ ] **Step 1: 引入 ScrollArea 并增加 Tab 节点 refs**

将 `ScrollArea`、`ScrollBar` 从 `@/ui/ScrollArea` 引入；将当前 `containerRef` 保留为 pill 定位的内容容器 ref，并增加 `tabRefs`：

```tsx
import { ScrollArea, ScrollBar } from '@/ui/ScrollArea'

const tabRefs = useRef(new Map<string, HTMLDivElement>())
```

为每个 Tab 的根 `div` 增加 callback ref，在卸载时从 Map 删除：

```tsx
ref={(element) => {
  if (element) tabRefs.current.set(tab.id, element)
  else tabRefs.current.delete(tab.id)
}}
```

- [ ] **Step 2: 在现有 effect 中更新 pill 并自动滚动激活 Tab**

将 effect 调整为在 tabs 或 activeTabId 变化时先更新 pill，再查找当前 Tab 并调用：

```tsx
useEffect(() => {
  updatePill()
  tabRefs.current.get(activeTabId)?.scrollIntoView({ inline: 'nearest' })
}, [activeTabId, tabs])
```

保持现有 `updatePill` 的 `offsetLeft`/`offsetWidth` 计算，不改为监听 `scrollLeft`，从而确保 pill 与滚动内容同步移动。

- [ ] **Step 3: 用 ScrollArea 包裹现有 Tab 内容并启用横向 ScrollBar**

保持外层 `data-slot='nav-tab'` 的尺寸、padding 和 `overflow-hidden`；将原来的相对 flex 内容放进 `ScrollArea`，并让内容节点保持 `relative flex h-full w-max min-w-full`，确保 Tab 总宽度可超过 viewport：

```tsx
<ScrollArea className='size-full'>
  <div
    ref={containerRef}
    className='relative flex h-full w-max min-w-full'
  >
    {/* tabs 与 pill 原有内容 */}
  </div>
  <ScrollBar orientation='horizontal' />
</ScrollArea>
```

由于 `ScrollArea` 默认已经渲染一个纵向 ScrollBar，Task 2 需要同步调整 `src/ui/ScrollArea/index.tsx` 的使用方式或组件 API，使 NavTab 不出现纵向滚动条：优先在 `ScrollArea` 增加 `hideScrollbar`/方向配置会扩大公共 API，因此本任务采用直接在 `ScrollArea` 内新增可选 `scrollbar` prop，仅在 NavTab 传入 `scrollbar='horizontal'` 时渲染横向滚动条；默认行为保持现有组件兼容。具体接口应为：

```tsx
<ScrollArea
  scrollbar='horizontal'
  className='size-full'
>
  ...
</ScrollArea>
```

并删除 NavTab 中额外的 `ScrollBar` 子节点，避免重复渲染。若实现时确认 Base UI 的默认纵向 ScrollBar 可通过 CSS 完全隐藏而不改公共 API，则保持现有 API，使用 `ScrollArea` + `ScrollBar orientation='horizontal'` 并隐藏默认纵向条；不得同时渲染两个横向条。

- [ ] **Step 4: 运行 NavTab 测试确认通过**

Run: `pnpm test -- test/components/NavTab.test.tsx`

Expected: NavTab 现有测试与新增滚动测试全部 PASS。

### Task 3: 执行完整质量验证

**Files:**

- Modify: `src/layout/NavTab/nav-tab.tsx`
- Modify: `src/ui/ScrollArea/index.tsx`（仅当 Task 2 为隐藏默认纵向滚动条所必需）
- Modify: `test/components/NavTab.test.tsx`

**Interfaces:**

- Consumes: Task 1 的回归测试与 Task 2 的组件实现。
- Produces: 可合并的 NavTab 横向滚动实现。

- [ ] **Step 1: 运行完整测试**

Run: `pnpm test`

Expected: 所有 Vitest 测试 PASS。

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`

Expected: ESLint 退出码为 0，无新增错误。

- [ ] **Step 3: 运行生产构建**

Run: `pnpm build`

Expected: TypeScript 项目构建和 Vite 生产构建均成功完成。

- [ ] **Step 4: 检查最终 diff 与工作区状态**

Run: `git diff --check && git status --short`

Expected: 无 whitespace 错误；仅包含本需求相关的实现、测试或必要的 ScrollArea API 修改。
