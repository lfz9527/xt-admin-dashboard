# DataTable 基于 TanStack Table 重构设计

**日期**: 2026-08-22
**状态**: 已确认

## 概述

将 `src/components/DataTable` 的表格引擎从自研列渲染逻辑替换为 `@tanstack/react-table`（headless，v8），DOM 骨架继续使用 `src/ui/Table`，分页条使用 `src/ui/Pagination`，空态使用 `src/ui/Empty`，加载态使用 `src/components/Loading`。组件仍为纯展示层：数据获取、分页状态、排序状态均由调用方通过 `useRequest` 受控传入。

## 组件接口

```ts
type DataTableProps<T> = {
  /** TanStack 原生列定义（accessorKey/cell/header 等） */
  columns: ColumnDef<T>[]
  /** 数据源 */
  data: readonly T[]
  /** 行唯一标识：字段名或返回唯一值的函数，映射 TanStack getRowId */
  rowKey: string | ((record: T) => string)
  /** 加载态，true 时表格区域叠加 Loading 遮罩 */
  loading?: boolean
  /** 空态插槽，缺省时内置 Empty + EmptyTitle「暂无数据」 */
  empty?: ReactNode
  /** 受控分页，传入即显示底部分页条 */
  pagination?: {
    /** 数据总条数 */
    total: number
    /** 当前页码，从 1 开始（内部映射 TanStack pageIndex） */
    page: number
    /** 每页条数 */
    pageSize: number
    /** 翻页回调，由调用方更新状态并重新拉取数据 */
    onChange: (page: number, pageSize: number) => void
  }
  /** 受控排序状态（TanStack SortingState） */
  sorting?: SortingState
  /** 排序变化回调，由调用方更新状态并重新拉取数据 */
  onSortingChange?: (sorting: SortingState) => void
  className?: string
  style?: CSSProperties
}
```

## 内部实现要点

1. **useReactTable 配置**：
   - `data`、`columns` 直接透传
   - `getRowId`：由 `rowKey`（字符串字段名或函数）生成
   - `state`：`{ pagination: { pageIndex: page - 1, pageSize }, sorting }`
   - `manualPagination: true`、`manualSorting: true`（服务端受控模式）
   - `onPaginationChange`：映射回 `pagination.onChange(pageIndex + 1, pageSize)`
   - `onSortingChange`：透传调用方
   - `getCoreRowModel()`

2. **表头渲染**：`flexRender(header.column.columnDef.header, header.getContext())`；`column.getCanSort()` 为 true 的列渲染排序图标（lucide：`ArrowUpIcon`/`ArrowDownIcon`/`ChevronsUpDownIcon`），点击触发排序切换。

3. **表体渲染**：`row.getVisibleCells()` 遍历 + `flexRender(cell.column.columnDef.cell, cell.getContext())`。

4. **空态**：`data` 为空且非 loading 时，在 `TableBody` 内渲染一行跨列（`colSpan={columns.length}`）的 `TableCell`，内容为 `empty` 插槽或内置 `Empty` + `EmptyHeader` + `EmptyTitle`（文案「暂无数据」）。

5. **加载态**：`loading` 为 true 时叠加 `Loading` 遮罩（`data-testid='datatable-loading'`），不清空表格内容。

6. **分页条**：`pagination` props 存在且数据非空时显示，复用 `src/ui/Pagination` 组装，页码序列沿用 `getPageItems`（>7 页折叠省略号），首页/末页禁用对应翻页按钮。

## 文件结构

```
src/components/DataTable/
├── index.tsx   # 主组件（TanStack 引擎 + ui/Table 骨架 + 分页条 + 空态/加载态）
└── types.ts    # DataTableProps 等类型
test/components/DataTable.test.tsx   # 单元测试
```

## 依赖

- 新增 `@tanstack/react-table`（headless，无样式依赖）

## 测试要点

- 渲染表头与数据单元格（ColumnDef 写法）
- 空态：默认「暂无数据」与自定义 `empty` 插槽
- loading 遮罩显示/隐藏
- 受控分页：翻页触发 `onChange`、边界禁用、省略号折叠
- 受控排序：点击可排序表头触发 `onSortingChange`，不可排序列不触发

## 不做的事（YAGNI）

- 不内嵌请求逻辑，不主动调用 `useRequest`（调用方负责）
- 不做行选择、列固定、横向滚动配置等高级特性
- 不替换 `src/ui/Table` / `src/ui/Pagination` / `src/ui/Empty` 骨架
