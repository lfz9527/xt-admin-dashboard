# DataTable 基于 TanStack Table v9 重构设计

**日期**: 2026-08-22
**状态**: 已确认（v8 方案废弃，改用 v9）

## 概述

将 `src/components/DataTable` 的表格引擎替换为 `@tanstack/react-table@9.1.2`（headless，atom/store 驱动，全新 API），DOM 骨架继续使用 `src/ui/Table`，分页条使用 `src/ui/Pagination`，空态使用 `src/ui/Empty`，加载态使用 `src/components/Loading`。组件仍为纯展示层：数据获取、分页状态、排序状态均由调用方通过 `useRequest` 受控传入。

## v9 关键 API（与 v8 的差异）

- `useReactTable` → `useTable(options, selector?)`；第二参为 state selector，`table.state` 反映所选切片。
- **Features 显式注册**：无隐式功能包。模块级常量 `tableFeatures({ rowSortingFeature, rowPaginationFeature, columnMeta: metaHelper<T>() })`；服务端模式不注册 row models。
- 渲染用 `table.getHeaderGroups()`、`table.getRowModel().rows`、`row.getAllCells()`，模板用 `<table.FlexRender header={header} />` / `<table.FlexRender cell={cell} />`。
- 受控状态（Pattern A）：`state: { sorting, pagination }` + 各自 `on*Change` 回调；回调收到 `Updater<T> = T | ((old) => T)`，需手动解析函数形式。
- 列类型三泛型：`ColumnDef<TFeatures, TData, TValue>`；`RowData = Record<string, any> | Array<any>`，组件泛型必须写 `TData extends RowData`。
- 排序改名：`sortingFn` → `sortFn` 等；排序 API 不变（`getCanSort()/getIsSorted()/getToggleSortingHandler()`）。
- 列 meta 用 per-table 槽位：`columnMeta: metaHelper<{ align?; width? }>()`（推荐，免全局声明合并）。
- `getRowId` 仍是表选项，签名 `(originalRow, index, parent?) => string`。

## 组件接口

```ts
type DataTableProps<TData extends RowData> = {
  /** TanStack 原生列定义（需携带组件导出的 TFeatures 泛型） */
  columns: ColumnDef<DataTableFeatures, TData>[]
  /** 数据源 */
  data: readonly TData[]
  /** 行唯一标识：字段名或返回唯一值的函数，映射 TanStack getRowId */
  rowKey: string | ((record: TData) => string)
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
  /** 受控排序状态 */
  sorting?: SortingState
  /** 排序变化回调，由调用方更新状态并重新拉取数据 */
  onSortingChange?: (sorting: SortingState) => void
  className?: string
  style?: CSSProperties
}
```

`DataTableFeatures` 为组件模块内定义的 features 常量类型（`typeof features`），随组件一起导出，供调用方写列定义时携带。

## 内部实现要点

1. **模块级 features 常量**（不可在渲染内重建）：

```ts
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnMeta: metaHelper<{
    align?: 'left' | 'center' | 'right'
    width?: number | string
  }>(),
})
```

2. **useTable 配置**（Pattern A 受控）：

```ts
const table = useTable(
  {
    features,
    columns,
    data: [...data],
    getRowId: (record) => rowKey 解析结果,
    manualSorting: true,
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting ?? []) : updater
      onSortingChange?.(next)
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize }
      const next = typeof updater === 'function' ? updater(current) : updater
      pagination?.onChange(next.pageIndex + 1, next.pageSize)
    },
  },
  (state) => ({ sorting: state.sorting, pagination: state.pagination })
)
```

3. **表头渲染**：`table.getHeaderGroups()` 遍历，`<table.FlexRender header={header} />`；`header.column.getCanSort()` 为 true 的列渲染排序图标（lucide ArrowUp/ArrowDown/ChevronsUpDown）并挂 `getToggleSortingHandler()`。

4. **表体渲染**：`table.getRowModel().rows` 遍历 + `row.getAllCells()` + `<table.FlexRender cell={cell} />`。

5. **空态**：`data` 为空且非 loading 时，跨列 `TableCell` 内渲染 `empty` 插槽或内置 `Empty` + `EmptyHeader` + `EmptyTitle`（「暂无数据」）。

6. **加载态**：`loading` 为 true 时叠加 `Loading` 遮罩（`data-testid='datatable-loading'`）。

7. **分页条**：`pagination` 存在且数据非空时显示，复用 `src/ui/Pagination`，页码序列沿用 `getPageItems`（>7 页折叠省略号），首页/末页禁用。注意：v9 manual 模式下排序不自动重置页码，如需「排序后回第 1 页」由调用方在 `onSortingChange` 内自行处理（首版不做，保持 YAGNI）。

## 文件结构

```
src/components/DataTable/
├── index.tsx   # 主组件（features 常量 + useTable 引擎 + ui/Table 骨架 + 分页条 + 空态/加载态）
└── types.ts    # DataTableProps 等类型（不含 DataTableFeatures——features 定义在 index.tsx）
test/components/DataTable.test.tsx   # 单元测试
```

## 依赖

- 新增 `@tanstack/react-table@^9.1.2`（headless，无样式依赖）

## 测试要点

- 渲染表头与数据单元格（ColumnDef 写法，携带 TFeatures）
- 空态：默认「暂无数据」与自定义 `empty` 插槽
- loading 遮罩显示/隐藏
- 受控分页：翻页触发 `onChange`（pageIndex+1 映射）、边界禁用、省略号折叠
- 受控排序：点击可排序表头触发 `onSortingChange`，升/降序图标展示

## 不做的事（YAGNI）

- 不内嵌请求逻辑，不主动调用 `useRequest`（调用方负责）
- 不做行选择、列固定、横向滚动配置、排序后自动重置页码等高级特性
- 不替换 `src/ui/Table` / `src/ui/Pagination` / `src/ui/Empty` 骨架
- 不使用 `@tanstack/react-table/legacy`（v8 兼容桥，官方标注仅临时迁移用）
