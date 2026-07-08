# Collapse 组件设计

日期：2026-07-08

## 概述

基于 `src/ui/Collapsible/` 封装数据驱动的折叠面板组 `Collapse`，放置在 `src/components/Collapse/` 目录下。

## 文件结构

```
src/components/Collapse/
├── index.ts          # 导出
├── collapse.tsx      # 组件实现
└── README.md         # 使用案例和说明
```

## 类型定义

```ts
interface CollapseItem {
  key: string // 唯一标识
  title: ReactNode // 触发器内容
  children: ReactNode // 折叠内容
  defaultOpen?: boolean // 初始展开状态（非受控模式）
  disabled?: boolean // true → 禁止展开；true + defaultOpen → 禁止收起
}

interface CollapseProps {
  items: CollapseItem[]
  type?: 'multiple' | 'accordion' // 默认 'multiple'
  openKeys?: string[] // 受控：当前展开的 key 列表
  defaultOpenKeys?: string[] // 非受控：初始展开的 key 列表
  onToggle?: (key: string, open: boolean) => void // 受控模式回调
}
```

## 核心逻辑

### 受控 / 非受控

- **非受控**：未传 `openKeys` 时，内部 `useState` 管理状态；`defaultOpenKeys` 或 `item.defaultOpen` 设置初始值
- **受控**：传入 `openKeys` 时完全由外部控制，通过 `onToggle` 通知外部状态变化

### 展开模式

- **`multiple`（默认）**：各面板独立展开/收起，互不影响
- **`accordion`**：同一时间只有一个面板展开，新展开时自动关闭当前展开项

### disabled 行为

- `disabled=true` 且 `defaultOpen=false/undefined`：禁止展开，点击无反应
- `disabled=true` 且 `defaultOpen=true`：禁止收起，面板始终展开

### 渲染

基于 `src/ui/Collapsible/` 的 `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` 组合渲染每个 item。

## 使用示例

```tsx
import { Collapse, type CollapseItem } from '@/components/Collapse'

const items: CollapseItem[] = [
  { key: 'a', title: '标题一', children: '内容一' },
  { key: 'b', title: '标题二', children: '内容二', defaultOpen: true },
  { key: 'c', title: '标题三', children: '内容三', disabled: true },
]

// 非受控，独立模式（默认）
<Collapse items={items} />

// 非受控，手风琴模式
<Collapse items={items} type="accordion" />

// 受控模式
<Collapse
  items={items}
  openKeys={openKeys}
  onToggle={(key, open) => setOpenKeys(prev => open ? [...prev, key] : prev.filter(k => k !== key))}
/>
```

## README 内容要点

- CollapseItem 字段说明表格
- CollapseProps 属性说明表格
- 四种场景的完整示例代码：默认独立模式、手风琴模式、受控模式、disabled 行为
