# NavTab 横向滚动设计

## 目标

当导航 Tab 总宽度超过可用空间时，使用现有 `ScrollArea` 组件提供横向滚动条；切换或新增并激活 Tab 时，自动将当前 Tab 滚动到可见区域。

## 方案

在 `src/layout/NavTab/nav-tab.tsx` 中使用 `ScrollArea` 包裹 Tab 内容，并通过 `ScrollBar` 配置横向滚动条。滚动内容节点继续作为 pill 高亮的定位基准，使 pill 与 Tab 一起滚动，不需要监听 `scrollLeft` 或实时修正 pill 位置。

保留现有外层布局尺寸和 Tab 渲染结构，仅增加：

- `ScrollArea` 作为可滚动区域容器。
- 横向 `ScrollBar`，纵向滚动条不启用。
- viewport、内容容器和当前 Tab 的 refs。
- 在激活 Tab 或 tabs 列表变化后，更新 pill 位置并调用当前 Tab 的 `scrollIntoView({ inline: 'nearest' })`。

## 行为与边界

- Tab 未超出容器时不显示可用的横向滚动条。
- Tab 超出容器时由 `ScrollArea` 显示底部横向滚动条。
- 点击不可见 Tab 后，该 Tab 自动滚动到可见区域。
- 新增并激活 Tab 后，该 Tab 自动滚动到可见区域。
- pill 的 `left` 和 `width` 仍以滚动内容容器内的 Tab 偏移量为准，滚动时与内容同步移动。
- tabs 为空时继续不渲染 NavTab。

## 验证

- 运行 NavTab 相关 Vitest 测试。
- 运行 `pnpm lint`。
- 运行 `pnpm build`。
- 检查现有布局下 Tab 样式、pill 高亮和关闭操作未改变。
