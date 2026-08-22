# XtTable 数据驱动表格组件设计

**日期**: 2026-08-22
**状态**: 已确认

## 概述

基于 `src/ui/Table` 基础表格结构，封装一个数据驱动（列配置 + 数据源驱动渲染）的业务表格组件 `XtTable`，放置于 `src/components/XtTable/`。表格本身不发起请求，数据获取、loading、分页状态均由调用方通过 `useRequest` 管理（符合 `src/service` 接口必须搭配 `useRequest` 使用的项目约定），通过 props 受控传入。

## 组件接口

### XtColumn（列配置）

```ts
export type XtColumn<T = Global.AnyObj> = {
  /** 列唯一标识 */
  key: string
  /** 表头文案 */
  title: ReactNode
  /** 从 record 取值的字段；为空时仅用 render 渲染 */
  dataIndex?: string
  /** 列宽，透传到 th/td 的 style.width */
  width?: number | string
  /** 对齐方式，默认 left */
  align?: 'left' | 'center' | 'right'
  /** 自定义渲染，优先级高于 dataIndex */
  render?: (value: unknown, record: T, index: number) => ReactNode
}
```

### XtPagination（受控分页）

```ts
export type XtPagination = {
  /** 数据总条数 */
  total: number
  /** 当前页码，从 1 开始 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 翻页回调，由调用方更新状态并重新拉取数据 */
  onChange: (page: number, pageSize: number) => void
}
```

### XtTableProps

```ts
export type XtTableProps<T = Global.AnyObj> = {
  columns: XtColumn<T>[]
  dataSource: readonly T[]
  /** 行唯一标识：字段名或返回唯一值的函数 */
  rowKey: string | ((record: T) => string)
  /** 加载态，true 时表格区域叠加 Loading 遮罩 */
  loading?: boolean
  /** 空态文案，默认「暂无数据」 */
  emptyText?: ReactNode
  /** 传入即显示底部受控分页条 */
  pagination?: XtPagination
  className?: string
  style?: React.CSSProperties
}
```

## 渲染逻辑

1. **表头**：遍历 `columns` 渲染 `TableHead`，`align` 映射为 `text-left/center/right`，`width` 写入 `style.width`。
2. **表体**：遍历 `dataSource`，每行以 `rowKey` 生成 key；每个单元格优先调用 `column.render(value, record, index)`，否则取 `record[column.dataIndex]` 渲染。
3. **加载态**：`loading` 为 true 时在表格外层容器叠加居中 `Loading` 遮罩（复用 `src/components/Loading`），不清空表格内容。
4. **空态**：`dataSource` 为空且非 loading 时，在 `TableBody` 内渲染一行跨列（`colSpan={columns.length}`）的 `TableCell`，内容为 `emptyText`（默认「暂无数据」）。
5. **分页条**：`pagination` props 存在时，在表格底部渲染受控分页条。复用 `src/ui/Pagination` 组合式组件（无状态，仅提供骨架）：XtTable 负责根据 `total/page/pageSize` 计算总页数与页码序列（含首末页与省略号），组装 `Pagination/PaginationContent/PaginationItem/PaginationLink/PaginationNext/PaginationPrevious` 并调用 `onChange(newPage, pageSize)`；首页/末页时禁用对应翻页按钮，当前页 `isActive`。

## 文件结构

```
src/components/XtTable/
├── index.tsx   # 主组件（分页条复用 src/ui/Pagination）
└── types.ts    # XtColumn / XtPagination / XtTableProps
test/components/XtTable.test.tsx   # 单元测试
```

## 测试要点

- 渲染表头与数据单元格
- `render` 优先级高于 `dataIndex`
- `rowKey` 为函数与字符串两种形式
- loading 时显示遮罩，空数据时显示空态文案
- 分页：总数展示、上一页/下一页点击触发 `onChange`、边界禁用

## 不做的事（YAGNI）

- 不内嵌请求逻辑，不主动调用 `useRequest`（调用方负责）
- 不实现行选择、排序、固定列、横向滚动配置等高级特性
- 分页条复用 `src/ui/Pagination` 组合式组件，不自行实现翻页 UI
- 不新增全局 Empty 组件（空态为组件内置占位）
