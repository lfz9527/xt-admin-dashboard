# DataTable 基于 TanStack Table v9 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/components/DataTable` 的表格引擎替换为 `@tanstack/react-table@9.1.2`（v9 全新 API），DOM 骨架使用 `src/ui/Table`，分页条使用 `src/ui/Pagination`，空态改用 `src/ui/Empty`，并新增受控列排序。

**Architecture:** v9 的 `useTable` + 显式 `features` 注册（rowSortingFeature/rowPaginationFeature/columnMeta 槽位），Pattern A 受控状态（`state` + `on*Change`），`table.FlexRender` 渲染模板。DataTable 仍为纯展示层，数据/分页/排序由调用方受控。

**Tech Stack:** React 19、TypeScript、`@tanstack/react-table@^9.1.2`、Tailwind CSS v4 语义化主题变量、lucide-react 排序图标、Vitest + Testing Library、`@/` 路径别名。

## Global Constraints

- 跨目录导入使用 `@/*` 别名（`@/` 映射 `src/*`）。
- UI 组件使用语义化主题变量（`bg-background`、`text-muted-foreground` 等）与 `cn` 合并类名，保持 `data-slot` 约定。
- DataTable 为纯展示层组件：不内嵌请求逻辑、不调用 `useRequest`；数据获取与分页/排序状态由调用方受控传入。
- 分页 `page` 为 1-based（调用方视角），内部映射 TanStack `pageIndex`（0-based），`onChange` 回调再映射回 1-based。
- v9 受控回调收到 `Updater<T> = T | ((old) => T)`，必须手动解析函数形式。
- `features` 常量必须模块级定义，禁止在渲染内重建；`data`/`columns` 引用保持稳定。
- 组件泛型约束 `TData extends RowData`（`RowData = Record<string, any> | Array<any>`）需写在每个中间类型上。
- 空态使用 `src/ui/Empty` 组合组件，默认标题「暂无数据」；支持 `empty` 插槽。
- 提交信息使用中文，遵循 git-conventions：**每次 `git commit` 前必须通过 AskUserQuestion 让用户确认提交信息**；提交前逐个 `git add`，禁止 `git add .`。
- 单测命令：`pnpm exec vitest run test/components/DataTable.test.tsx`；全部完成后运行 `pnpm lint`、`pnpm build`、`pnpm test`。
- 项目 TypeScript 开启 `noUnusedLocals`（tsconfig.app.json），ESLint 含 `no-duplicate-imports`——同一模块 value 与 type 导入合并为一行。
- 不使用 `@tanstack/react-table/legacy`（官方标注仅临时迁移用）。
- 不做行选择、列固定、排序后自动重置页码等高级特性（见 spec YAGNI 节）。

---

### Task 1: 确认依赖并重写 types.ts

**Files:**

- Modify: `src/components/DataTable/types.ts`（删 DataTableColumn，改 v9 接口）
- Modify: `test/components/DataTable.test.tsx`（列定义改 v9 ColumnDef + TFeatures）

**Interfaces:**

- Consumes: `@tanstack/react-table` 的 `ColumnDef`、`SortingState`、`RowData` 类型；`DataTableFeatures`（组件内部 features 类型，Task 2 定义后导出）
- Produces: `DataTablePagination`（保留形状）、`DataTableProps<TData>`（columns: ColumnDef<DataTableFeatures, TData>[]、data: readonly TData[]、rowKey、loading、empty、pagination、sorting、onSortingChange、className、style）

- [ ] **Step 1: 确认依赖版本**

Run: `grep -n "tanstack" package.json`
Expected: `"@tanstack/react-table": "^9.1.2"`（已安装，无需再装）

- [ ] **Step 2: 重写 types.ts**

覆盖 `src/components/DataTable/types.ts`：

```ts
import type { CSSProperties, ReactNode } from 'react'

import type { ColumnDef, RowData, SortingState } from '@tanstack/react-table'

import type { DataTableFeatures } from './index'

export type DataTablePagination = {
  /** 数据总条数 */
  total: number
  /** 当前页码，从 1 开始（内部映射 TanStack pageIndex） */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 翻页回调，由调用方更新状态并重新拉取数据 */
  onChange: (page: number, pageSize: number) => void
}

export type DataTableProps<TData extends RowData = Global.AnyObj> = {
  /** TanStack 原生列定义（携带组件导出的 DataTableFeatures 泛型） */
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
  pagination?: DataTablePagination
  /** 受控排序状态 */
  sorting?: SortingState
  /** 排序变化回调，由调用方更新状态并重新拉取数据 */
  onSortingChange?: (sorting: SortingState) => void
  className?: string
  style?: CSSProperties
}
```

注意：`DataTableFeatures` 在 Task 2 的 index.tsx 中定义并导出（`export type DataTableFeatures = typeof features`），types.ts 从 './index' 导入它。Task 1 阶段该类型尚不存在会导致 tsc 报错——这是预期的（Task 2 补齐）。

- [ ] **Step 3: 更新测试文件顶部（v9 列定义）**

将 `test/components/DataTable.test.tsx` 顶部改为：

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'

type User = { id: number; name: string; age: number }

const columns: ColumnDef<DataTableFeatures, User>[] = [
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'age', header: '年龄', meta: { align: 'center', width: 100 } },
  {
    id: 'action',
    header: '操作',
    cell: ({ row }) => `操作-${row.original.name}`,
  },
]

const users: User[] = [
  { id: 1, name: '张三', age: 18 },
  { id: 2, name: '李四', age: 20 },
]
```

并将整个文件中所有 `<DataTable ... dataSource={...}` 改为 `<DataTable ... data={...}`（共 14 处）；「支持自定义空态文案」用例的 `emptyText='没有数据'` 改为 `empty={<span>没有数据</span>}`（新接口）。

- [ ] **Step 4: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: FAIL——`DataTableFeatures` 未定义（tsc 报错）或旧组件读取 `dataSource` 崩溃。符合 TDD RED 预期。

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/DataTable/types.ts test/components/DataTable.test.tsx
```

提交信息：

```
feat: DataTable 接入 TanStack v9 列定义接口

- DataTableProps 改用 ColumnDef<DataTableFeatures, TData>/data 接口，列配置迁移为 accessorKey/cell 写法
- 测试同步改造（emptyText 改为 empty 插槽）
```

---

### Task 2: 重写 DataTable 主组件（v9 引擎 + 渲染 + 空态/加载态）

**Files:**

- Modify: `src/components/DataTable/index.tsx`（整体重写）

**Interfaces:**

- Consumes: Task 1 的 `DataTableProps<TData>`；`@tanstack/react-table` 的 `useTable/tableFeatures/rowSortingFeature/rowPaginationFeature/metaHelper`；`src/ui/Table` 的 Table/TableHeader/TableBody/TableHead/TableRow/TableCell；`src/ui/Empty` 的 Empty/EmptyHeader/EmptyTitle；`src/components/Loading`（default export）；`cn`；lucide 排序图标
- Produces: `DataTable<TData>`（具名导出）、`export type { DataTableFeatures }`（`typeof features`）、`export type { DataTablePagination, DataTableProps } from './types'`

- [ ] **Step 1: 编写失败测试（空态插槽 + 加载态 + 基础渲染）**

先更新 `test/components/DataTable.test.tsx` 的「加载态与空态」describe 块为：

```tsx
describe('DataTable 加载态与空态', () => {
  it('loading 为 true 时显示加载遮罩', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        loading
      />
    )
    expect(screen.getByTestId('datatable-loading')).toBeInTheDocument()
  })

  it('loading 为 false 时不显示遮罩', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
      />
    )
    expect(screen.queryByTestId('datatable-loading')).not.toBeInTheDocument()
  })

  it('空数据显示默认空态文案', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey='id'
      />
    )
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('支持 empty 插槽自定义空态', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey='id'
        empty={<span>没有数据</span>}
      />
    )
    expect(screen.getByText('没有数据')).toBeInTheDocument()
  })
})
```

「列对齐与宽度映射到表头单元格」用例改为验证 meta 映射：

```tsx
it('列 meta 的 align 与 width 映射到表头单元格', () => {
  const { container } = render(
    <DataTable
      columns={columns}
      data={users}
      rowKey='id'
    />
  )
  const th = container.querySelector('th:nth-child(2)')
  expect(th).toHaveClass('text-center')
  expect(th).toHaveStyle({ width: '100px' })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: FAIL——组件尚未实现 v9 渲染。

- [ ] **Step 3: 实现主组件**

覆盖 `src/components/DataTable/index.tsx`（完整代码，v9 API，已按研究文档验证）：

```tsx
import {
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'

import Loading from '@/components/Loading'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/Pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/Table'
import { cn } from '@/utils/common'

import type { DataTableProps } from './types'

// 模块级 features：必须稳定，禁止在渲染内重建
// 服务端模式：不注册 sortedRowModel/paginatedRowModel，仅注册状态/API 特性
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnMeta: metaHelper<{
    align?: 'left' | 'center' | 'right'
    width?: number | string
  }>(),
})

export type DataTableFeatures = typeof features

const alignClassMap: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

// 页码序列：总数 <= 7 全展示；否则首尾恒显，当前页 ±1，其余折叠为省略号
function getPageItems(
  page: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: (number | 'ellipsis')[] = [1]
  if (page > 4) items.push('ellipsis')
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i += 1) items.push(i)
  if (page < totalPages - 3) items.push('ellipsis')
  items.push(totalPages)
  return items
}

function DataTable<TData extends RowData>({
  columns,
  data,
  rowKey,
  loading = false,
  empty,
  pagination,
  sorting,
  onSortingChange,
  className,
  style,
}: DataTableProps<TData>) {
  const isEmpty = data.length === 0
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 0

  const table = useTable(
    {
      features,
      columns,
      data: [...data],
      getRowId: (record) =>
        typeof rowKey === 'function'
          ? rowKey(record)
          : String((record as Record<string, unknown>)[rowKey]),
      manualSorting: true,
      manualPagination: true,
      pageCount: totalPages,
      state: {
        sorting: sorting ?? [],
        pagination: pagination
          ? { pageIndex: pagination.page - 1, pageSize: pagination.pageSize }
          : { pageIndex: 0, pageSize: 10 },
      },
      onSortingChange: (updater) => {
        const next =
          typeof updater === 'function' ? updater(sorting ?? []) : updater
        onSortingChange?.(next)
      },
      onPaginationChange: (updater) => {
        const current: PaginationState = pagination
          ? { pageIndex: pagination.page - 1, pageSize: pagination.pageSize }
          : { pageIndex: 0, pageSize: 10 }
        const next = typeof updater === 'function' ? updater(current) : updater
        pagination?.onChange(next.pageIndex + 1, next.pageSize)
      },
    },
    (state) => ({ sorting: state.sorting, pagination: state.pagination })
  )

  return (
    <div
      className={cn('relative', className)}
      style={style}
    >
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        alignClassMap[meta?.align ?? 'left'],
                        header.column.getCanSort() &&
                          'cursor-pointer select-none'
                      )}
                      style={
                        meta?.width !== undefined
                          ? { width: meta.width }
                          : undefined
                      }
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === 'asc' ? (
                          <ArrowUpIcon className='size-3.5' />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDownIcon className='size-3.5' />
                        ) : (
                          <ChevronsUpDownIcon className='text-muted-foreground/50 size-3.5' />
                        ))}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isEmpty && !loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 p-0 text-center'
                >
                  {empty ?? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>暂无数据</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <TableCell
                        key={cell.id}
                        className={alignClassMap[meta?.align ?? 'left']}
                        style={
                          meta?.width !== undefined
                            ? { width: meta.width }
                            : undefined
                        }
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {loading && (
        <div
          data-testid='datatable-loading'
          className='bg-background/60 absolute inset-0 grid place-items-center'
        >
          <Loading />
        </div>
      )}
      {pagination && !isEmpty && (
        <div className='px-1 pt-3'>
          <Pagination className='justify-end'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={
                    pagination.page <= 1
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={() => {
                    if (pagination.page > 1) {
                      pagination.onChange(
                        pagination.page - 1,
                        pagination.pageSize
                      )
                    }
                  }}
                />
              </PaginationItem>
              {getPageItems(pagination.page, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === pagination.page}
                      onClick={() => {
                        if (item !== pagination.page) {
                          pagination.onChange(item, pagination.pageSize)
                        }
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  className={
                    pagination.page >= totalPages
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={() => {
                    if (pagination.page < totalPages) {
                      pagination.onChange(
                        pagination.page + 1,
                        pagination.pageSize
                      )
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export { DataTable }
export type { DataTablePagination, DataTableProps } from './types'
```

注意：`table.FlexRender` 是 `ReactTable` 实例上的组件属性，直接以 `<table.FlexRender header={header} />` 使用；`header.column.columnDef.meta` 类型由 `columnMeta: metaHelper<...>()` 槽位推导，无需 cast。

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: PASS——基础渲染、render 优先级、rowKey 函数、meta 映射、loading、空态默认/插槽全部通过。

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/DataTable/index.tsx test/components/DataTable.test.tsx
```

提交信息：

```
feat: DataTable 主组件接入 TanStack v9 渲染引擎

- useTable + tableFeatures 注册排序/分页特性与 columnMeta 槽位，导出 DataTableFeatures 类型
- table.FlexRender 渲染表头/单元格，列 meta 支持 align/width 映射，可排序列渲染排序图标
- 空态改用 ui/Empty 组合组件，支持 empty 插槽自定义
```

---

### Task 3: 受控排序 + 分页回归

**Files:**

- Modify: `test/components/DataTable.test.tsx`（新增排序用例；分页用例已由 Task 1 改 `data`）
- Modify: `src/components/DataTable/index.tsx`（如需修正）

**Interfaces:**

- Consumes: Task 2 的 `DataTable<TData>`；`SortingState` 类型
- Produces: 无新接口；验证 `sorting`/`onSortingChange` 受控行为与分页回归

- [ ] **Step 1: 追加失败测试（受控排序）**

在 `test/components/DataTable.test.tsx` 末尾追加：

```tsx
describe('DataTable 排序', () => {
  it('点击可排序表头触发 onSortingChange', () => {
    const onSortingChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        sorting={[]}
        onSortingChange={onSortingChange}
      />
    )
    fireEvent.click(screen.getByText('姓名'))
    expect(onSortingChange).toHaveBeenCalled()
  })

  it('排序状态为 asc 时展示升序图标', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        sorting={[{ id: 'name', desc: false }]}
        onSortingChange={vi.fn()}
      />
    )
    expect(
      container.querySelector('[data-slot=table-head] svg')
    ).toBeInTheDocument()
  })

  it('分页与排序可同时受控使用', () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        sorting={[{ id: 'name', desc: true }]}
        onSortingChange={vi.fn()}
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    fireEvent.click(screen.getByLabelText('Go to next page'))
    expect(onChange).toHaveBeenCalledWith(2, 10)
  })
})
```

注意：`姓名` 列默认 `enableSorting` 为 true（v9 未注册 `enableSorting` 选项时默认启用），`getCanSort()` 返回 true，无需额外配置。

- [ ] **Step 2: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: PASS——若「点击可排序表头」失败，检查 `TableHead` 的 `onClick` 是否挂载（v9 的 `getToggleSortingHandler` 在 `manualSorting` 下仍可用）。

- [ ] **Step 3: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/DataTable/index.tsx test/components/DataTable.test.tsx
```

提交信息：

```
feat: DataTable 支持受控列排序

- 可排序列表头点击触发 onSortingChange，展示升序/降序/未排序图标
- 新增排序用例：点击触发、asc 图标、分页与排序共存
```

---

### Task 4: 更新 roles 使用案例

**Files:**

- Modify: `src/pages/system/roles/index.tsx`

**Interfaces:**

- Consumes: Task 2/3 的 `DataTable<TData>`、`DataTableFeatures`；`ColumnDef`、`SortingState`
- Produces: 无新接口；roles 页面迁移为 v9 列定义并演示排序

- [ ] **Step 1: 更新 roles 页面**

覆盖 `src/pages/system/roles/index.tsx`：

```tsx
import { useState } from 'react'

import type { ColumnDef, SortingState } from '@tanstack/react-table'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'

// mock 角色数据：演示 DataTable 使用；接入真实接口后改为 useRequest 拉取
const mockRoles = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  name: `角色${i + 1}`,
  code: `ROLE_${i + 1}`,
  enabled: i % 3 !== 0,
  createdAt: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
}))

type Role = (typeof mockRoles)[number]

const columns: ColumnDef<DataTableFeatures, Role>[] = [
  { accessorKey: 'name', header: '角色名称' },
  { accessorKey: 'code', header: '角色编码', meta: { width: 140 } },
  {
    accessorKey: 'enabled',
    header: '状态',
    meta: { align: 'center' },
    cell: ({ getValue }) => (
      <span className={getValue() ? 'text-primary' : 'text-muted-foreground'}>
        {getValue() ? '启用' : '停用'}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    meta: { align: 'center', width: 160 },
  },
]

export default function Roles() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])

  const pageData = mockRoles.slice((page - 1) * pageSize, page * pageSize)

  return (
    <DataTable
      columns={columns}
      data={pageData}
      rowKey='id'
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={{
        total: mockRoles.length,
        page,
        pageSize,
        onChange: (nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        },
      }}
    />
  )
}
```

- [ ] **Step 2: 运行测试与校验**

Run: `pnpm exec vitest run test/pages/system/roles.test.tsx`、`pnpm lint`、`pnpm build`
Expected: 全部通过（roles 测试 2/2；lint 无 error；build 成功）

- [ ] **Step 3: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/pages/system/roles/index.tsx
```

提交信息：

```
feat: roles 页面迁移 TanStack v9 列定义并演示受控排序

- 列配置改为 accessorKey/cell 写法（携带 DataTableFeatures 泛型），状态列保留语义色渲染
- 新增 sorting 受控状态演示，与受控分页共存
```

---

### Task 5: 全量校验

**Files:**

- 无新增/修改

- [ ] **Step 1: 运行全部测试**

Run: `pnpm test`
Expected: 除已知 17 个既有失败（Loading/Menu/NavTab/routes 等，均与 DataTable 无关，已在基线提交验证存在）外，DataTable 与 roles 相关全部通过。

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`
Expected: 无 error

- [ ] **Step 3: 运行构建**

Run: `pnpm build`
Expected: TypeScript 检查通过，Vite 构建成功

- [ ] **Step 4: 检查工作区状态并确认无遗漏**

Run: `git status`
Expected: 工作区无 DataTable 相关未提交变更
