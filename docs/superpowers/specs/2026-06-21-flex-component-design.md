# Flex 布局组件设计

**日期**: 2026-06-21
**状态**: 已确认

## 概述

提供一个声明式的 Flex 布局组件，封装常用 CSS Flexbox 属性为 React props，通过 Tailwind CSS 4 工具类实现，替代行内样式的 Flex 布局写法。

## 组件接口

```tsx
type FlexProps = {
  // 主轴方向
  vertical?: boolean // 默认 false（水平），true 为纵向

  // 对齐与分布
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  gap?: number // Tailwind spacing 单位

  // 子元素 flex
  flex?: number | 'auto' | 'none' | 'initial' // 注入到所有直接子元素（> *）

  // 快捷变体
  center?: boolean // 快捷设置 align=center + justify=center

  // 扩展
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}
```

## Tailwind 类名映射

| Prop           | 值             | Tailwind 类                   |
| -------------- | -------------- | ----------------------------- |
| 默认（水平）   | —              | `flex`                        |
| `vertical`     | `true`         | `flex-col`                    |
| `align`        | `start`        | `items-start`                 |
| `align`        | `center`       | `items-center`                |
| `align`        | `end`          | `items-end`                   |
| `align`        | `stretch`      | `items-stretch`               |
| `align`        | `baseline`     | `items-baseline`              |
| `justify`      | `start`        | `justify-start`               |
| `justify`      | `center`       | `justify-center`              |
| `justify`      | `end`          | `justify-end`                 |
| `justify`      | `between`      | `justify-between`             |
| `justify`      | `around`       | `justify-around`              |
| `justify`      | `evenly`       | `justify-evenly`              |
| `wrap`         | `wrap`         | `flex-wrap`                   |
| `wrap`         | `nowrap`       | `flex-nowrap`                 |
| `wrap`         | `wrap-reverse` | `flex-wrap-reverse`           |
| `gap`          | `4`            | `gap-4`                       |
| `flex`（> \*） | `1`            | `[&>*]:flex-1`                |
| `flex`（> \*） | `auto`         | `[&>*]:flex-auto`             |
| `flex`（> \*） | `none`         | `[&>*]:flex-none`             |
| `flex`（> \*） | `initial`      | `[&>*]:flex-initial`          |
| `center`       | `true`         | `items-center justify-center` |

## 优先级规则

`center` 快捷属性的优先级高于 `align` 和 `justify`：

```tsx
<Flex
  center
  align='start'
  justify='between'
>
  {/* 实际渲染: items-center justify-center（center 胜出） */}
</Flex>
```

即当 `center={true}` 时，忽略 `align` 和 `justify` 的值，强制使用 `items-center justify-center`。

## 使用示例

```tsx
// 水平布局（默认）
<Flex gap={4} justify="between">
  <span>左</span>
  <span>右</span>
</Flex>

// 纵向布局
<Flex vertical gap={4}>
  <div>上</div>
  <div>下</div>
</Flex>

// 快捷居中
<Flex center>
  <span>水平垂直居中</span>
</Flex>

// 纵向 + 居中
<Flex vertical center gap={2}>
  <span>纵向居中排列</span>
</Flex>

// 子元素等分空间
<Flex flex={1} gap={4}>
  <div>A</div>
  <div>B</div>
  <div>C</div>
</Flex>

// 配合 className 扩展
<Flex vertical gap={6} className="w-full p-4">
  <Form />
</Flex>
```

## 文件结构

```
src/components/Flex/index.tsx    # 组件 + 类型定义
test/components/Flex.test.tsx    # 测试
```

## 测试清单

| 场景           | 输入                               | 预期断言                                  |
| -------------- | ---------------------------------- | ----------------------------------------- |
| 默认渲染       | `<Flex><span>a</span></Flex>`      | 容器有 `flex` 类                          |
| 纵向           | `vertical`                         | 容器有 `flex-col` 类                      |
| 对齐 + 分布    | `align="center" justify="between"` | `items-center justify-between`            |
| 换行 + 间距    | `wrap="wrap" gap={4}`              | `flex-wrap gap-4`                         |
| 子元素 flex    | `flex={1}`                         | 直接子元素有 `flex-1` 类                  |
| 快捷居中       | `center`                           | `items-center justify-center`             |
| center 覆盖    | `center align="start"`             | `items-center justify-center`（非 start） |
| 扩展 className | `className="w-full"`               | 合并用户类名                              |
| 扩展 style     | `style={{ padding: 8 }}`           | 保留 style 属性                           |

## 不在范围内

- `inline-flex` — 不需要
- 子项精确控制（alignSelf、order、flex-grow/shrink/basis 独立设置）— 通过 `flex` prop 注入到所有直接子元素已覆盖主要场景，精细控制直接写 Tailwind 类
- 响应式断点 — 用户自行通过 className 扩展
