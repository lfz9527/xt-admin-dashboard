# NavTab 组件设计

## 概述

浏览器式多标签页组件，支持标签页的打开、切换、关闭，提供 context + hook 管理标签页生命周期。

## 文件结构

```
src/components/NavTab/
├── index.ts      # 统一导出
├── nav-tab.tsx   # NavTab 组件（标签栏 UI）
└── context.tsx   # NavTabProvider + useNavTab hook
```

## 数据模型

```ts
interface Tab {
  id: string // 唯一标识
  title: string // 标签标题
  closable: boolean // 是否可关闭，默认 true
}
```

## Context API

| 属性/方法          | 类型                   | 说明                               |
| ------------------ | ---------------------- | ---------------------------------- |
| `tabs`             | `Tab[]`                | 当前所有标签页                     |
| `activeTabId`      | `string \| null`       | 当前激活的标签 ID                  |
| `addTab(tab)`      | `(tab: Tab) => void`   | 新增标签页，id 已存在则激活        |
| `removeTab(id)`    | `(id: string) => void` | 关闭标签页，若为当前页则激活前一个 |
| `setActiveTab(id)` | `(id: string) => void` | 切换标签页                         |

## NavTabProvider

- 管理 `tabs` 和 `activeTabId` 的内部状态
- 通过 context 向下分发状态和方法
- Props: `children`、可选的 `defaultTabs`、`defaultActiveTabId`

## useNavTab

- 封装 `useContext(NavTabContext)`
- 不在 Provider 内使用时抛出错误，与 `useSidebar()` 模式一致

## NavTab 组件

- 纯 UI 组件，从 context 读取数据渲染标签栏
- 横向排列，每个标签显示标题 + 关闭按钮（`closable: false` 时不显示）
- 激活态高亮，点击标签切换
- 不直接操作状态，通过 context 方法交互（`setActiveTab`、`removeTab`）

## 不在范围

- 不与路由系统耦合，先实现 UI 层
- 不支持拖拽排序、右键菜单
- 不支持 `updateTab`（YAGNI）
