# NavTab 左右滚动按钮实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为横向溢出的 NavTab 增加始终占位、边界禁用的左右滚动按钮，并隐藏原生滚动条但保留滚动能力。

**Architecture:** 扩展 `ScrollArea` 接收 viewport ref，并保留现有 `scrollbar` 方向 API；`NavTab` 通过 viewport ref 监听滚动与尺寸变化，计算是否溢出及左右边界，按钮点击使用 `scrollBy` 平滑滚动。按钮仅在存在横向溢出时渲染，滚动区域本身不额外增加 padding。

**Tech Stack:** React 19、TypeScript、Base UI ScrollArea、Tailwind CSS、Lucide React、Vitest、Testing Library。

## Global Constraints

- 仅修改滚动按钮所需的 NavTab、ScrollArea 和测试代码，不重构无关布局。
- 无横向溢出时不渲染左右按钮。
- 有横向溢出时按钮始终占位，左端禁用左按钮，右端禁用右按钮。
- 隐藏横向原生滚动条，但保留 viewport 的横向滚动、`scrollIntoView` 和 `scrollBy` 能力。
- 不增加 Tab 区域 padding，避免覆盖 Tab 或触发 HTML 外部滚动条。
- 保留现有 Tab 点击、关闭、pill 高亮和激活 Tab 自动滚动行为。
- 修改后运行 NavTab 测试、`pnpm lint` 和 `pnpm build`。

---

### Task 1: 增加滚动按钮回归测试

**Files:**

- Modify: `test/components/NavTab.test.tsx`

**Interfaces:**

- Consumes: `NavTabProvider`、`NavTab`、`useNavTab` 现有接口。
- Produces: 对按钮显示、禁用状态和滚动行为的回归测试。

- [ ] **Step 1: 写无溢出场景测试**

渲染少量 Tab，断言左右按钮不存在：

```tsx
expect(
  screen.queryByRole('button', { name: '向左滚动' })
).not.toBeInTheDocument()
expect(
  screen.queryByRole('button', { name: '向右滚动' })
).not.toBeInTheDocument()
```

- [ ] **Step 2: 写有溢出场景测试**

为 viewport 设置有限 `clientWidth` 与更大的 `scrollWidth`，触发组件尺寸更新，断言左右按钮存在、左按钮 disabled、右按钮可用。按钮使用明确 aria-label：`向左滚动`、`向右滚动`。

- [ ] **Step 3: 写按钮滚动测试**

为 viewport 提供 `scrollBy` spy，点击右按钮和左按钮，分别断言调用 `{ left: viewport.clientWidth, behavior: 'smooth' }` 与 `{ left: -viewport.clientWidth, behavior: 'smooth' }`。

- [ ] **Step 4: 运行测试确认新增断言失败**

Run: `pnpm exec vitest run test/components/NavTab.test.tsx`

Expected: 新增按钮查询或滚动调用断言失败；既有 `ResizeObserver` 环境问题需单独记录。

### Task 2: 实现 ScrollArea viewport ref 与隐藏滚动条

**Files:**

- Modify: `src/ui/ScrollArea/index.tsx`

**Interfaces:**

- Consumes: `ScrollAreaPrimitive.Root.Props`、`ScrollAreaPrimitive.Viewport` props。
- Produces: `ScrollArea` 支持 `viewportRef?: React.Ref<HTMLDivElement>`，并将其传给 viewport；横向 `ScrollBar` 保持 DOM 状态但通过 `hidden` 隐藏视觉滚动条。

- [ ] **Step 1: 扩展 props 类型并接收 viewportRef**

```tsx
function ScrollArea({
  className,
  children,
  scrollbar = 'vertical',
  viewportRef,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollbar?: 'vertical' | 'horizontal'
  viewportRef?: React.Ref<HTMLDivElement>
})
```

将 `ref={viewportRef}` 传给 `ScrollAreaPrimitive.Viewport`。

- [ ] **Step 2: 保持横向滚动条可挂载但视觉隐藏**

`ScrollBar` 的横向分支继续使用 `hidden`，不修改 viewport 的高度和 padding；垂直滚动条保持现有样式。

- [ ] **Step 3: 运行 lint 与类型检查**

Run: `pnpm lint`

Expected: 退出码 0。

### Task 3: 实现 NavTab 滚动状态与左右按钮

**Files:**

- Modify: `src/layout/NavTab/nav-tab.tsx`

**Interfaces:**

- Consumes: Task 2 的 `ScrollArea viewportRef`；现有 `tabs`、`activeTabId`、`setActiveTab`、`removeTab`。
- Produces: `向左滚动`、`向右滚动`按钮，以及 `hasOverflow`、`canScrollLeft`、`canScrollRight` 状态。

- [ ] **Step 1: 增加 viewport ref、状态和边界计算**

```tsx
const viewportRef = useRef<HTMLDivElement>(null)
const [scrollState, setScrollState] = useState({
  hasOverflow: false,
  canScrollLeft: false,
  canScrollRight: false,
})

function updateScrollState() {
  const viewport = viewportRef.current
  if (!viewport) return
  const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
  setScrollState({
    hasOverflow: maxScrollLeft > 0,
    canScrollLeft: viewport.scrollLeft > 0,
    canScrollRight: viewport.scrollLeft < maxScrollLeft,
  })
}
```

- [ ] **Step 2: 监听 scroll 和 resize，并在 tabs 变化后更新**

使用 effect 绑定 viewport 的 `scroll` 监听，并用 `ResizeObserver` 监听 viewport 与内容节点；tabs、activeTabId 变化后在 effect 中调用 `updateScrollState`。清理监听器和 observer。

- [ ] **Step 3: 增加滚动操作**

```tsx
function scrollTabs(direction: -1 | 1) {
  const viewport = viewportRef.current
  if (!viewport) return
  viewport.scrollBy({
    left: direction * viewport.clientWidth,
    behavior: 'smooth',
  })
}
```

- [ ] **Step 4: 渲染左右按钮和 ScrollArea**

当 `scrollState.hasOverflow` 为 true 时，在 ScrollArea 两侧渲染：

```tsx
<Button
  aria-label='向左滚动'
  disabled={!scrollState.canScrollLeft}
  onClick={() => scrollTabs(-1)}
>
  <ChevronLeft />
</Button>
<Button
  aria-label='向右滚动'
  disabled={!scrollState.canScrollRight}
  onClick={() => scrollTabs(1)}
>
  <ChevronRight />
</Button>
```

使用相对定位容器包裹按钮与 ScrollArea，按钮定位在左右两侧，不改变滚动内容的尺寸；按钮样式保持紧凑并覆盖在两端。

- [ ] **Step 5: 运行 NavTab 测试确认通过**

Run: `pnpm exec vitest run test/components/NavTab.test.tsx`

Expected: 新增按钮行为测试通过；若仍有 ResizeObserver 环境失败，报告具体失败原因。

### Task 4: 完成质量验证

**Files:**

- Modify: `src/ui/ScrollArea/index.tsx`
- Modify: `src/layout/NavTab/nav-tab.tsx`
- Modify: `test/components/NavTab.test.tsx`

- [ ] **Step 1: 运行完整测试**

Run: `pnpm test`

Expected: 记录所有测试结果，并区分基线环境失败与本次失败。

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`

Expected: 退出码 0。

- [ ] **Step 3: 运行构建**

Run: `pnpm build`

Expected: 记录 TypeScript 或 Vite 构建结果。

- [ ] **Step 4: 检查差异**

Run: `git diff --check && git status --short`

Expected: 无空白错误，仅包含本需求相关变更。
