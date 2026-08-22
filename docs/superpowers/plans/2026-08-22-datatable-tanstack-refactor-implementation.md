# DataTable 基于 TanStack Table 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/components/DataTable` 的表格引擎替换为 `@tanstack/react-table`，DOM 骨架继续使用 `src/ui/Table`，分页条使用 `src/ui/Pagination`，空态改用 `src/ui/Empty` 组合组件，并新增受控列排序能力。

**Architecture:** TanStack Table（headless）接管列渲染、排序、分页状态计算；DataTable 仍是纯展示层组件，数据/分页/排序状态均由调用方受控传入（`manualPagination` + `manualSorting`）。列配置直接使用 TanStack 原生 `ColumnDef<T>`。

**Tech Stack:** React 19、TypeScript、`@tanstack/react-table`（v8，headless）、Tailwind CSS v4 语义化主题变量、lucide-react 排序图标、Vitest + Testing Library、`@/` 路径别名。

## Global Constraints

- 跨目录导入使用 `@/*` 别名（`@/` 映射 `src/*`）。
- UI 组件使用语义化主题变量（`bg-background`、`text-muted-foreground` 等）与 `cn` 合并类名，保持 `data-slot` 约定。
- DataTable 为纯展示层组件：不内嵌请求逻辑、不调用 `useRequest`；数据获取与分页/排序状态由调用方受控传入。
- 分页 `page` 为 1-based（调用方视角），内部映射 TanStack `pageIndex`（0-based）。
- 空态使用 `src/ui/Empty` 组合组件（`Empty` + `EmptyHeader` + `EmptyTitle`），默认标题「暂无数据」；支持 `empty` 插槽自定义。
- 提交信息使用中文，遵循 git-conventions：**每次 `git commit` 前必须通过 AskUserQuestion 让用户确认提交信息**，不可跳过；提交前逐个 `git add` 文件，禁止 `git add .`。
- 单测运行命令：`pnpm exec vitest run test/components/DataTable.test.tsx`；全部完成后运行 `pnpm lint`、`pnpm build`、`pnpm test`。
- 项目 TypeScript 开启 `noUnusedLocals`（`tsconfig.app.json`），ESLint 含 `no-duplicate-imports` 规则——同一模块的 value 与 type 导入合并为一行。
- 不做行选择、列固定等高级特性（见 spec YAGNI 节）。

---

### Task 1: 安装依赖并重写 types.ts

**Files:**

- Modify: `package.json`（新增 @tanstack/react-table）
- Modify: `src/components/DataTable/types.ts`（删除 DataTableColumn，改 TanStack 接口）
- Modify: `test/components/DataTable.test.tsx`（列定义改为 ColumnDef，保留渲染断言）

**Interfaces:**

- Consumes: `@tanstack/react-table` 的 `ColumnDef`、`SortingState` 类型
- Produces: `DataTablePagination`（保留现有形状）、`DataTableProps<T>`（columns: ColumnDef<T>[]、data: readonly T[]、rowKey、loading、empty、pagination、sorting、onSortingChange、className、style）

- [ ] **Step 1: 安装依赖**

Run: `pnpm add @tanstack/react-table`
Expected: `package.json` 的 dependencies 出现 `"@tanstack/react-table": "^8.x.x"`

- [ ] **Step 2: 重写 types.ts**

覆盖 `src/components/DataTable/types.ts`：

```ts
import type { CSSProperties, ReactNode } from 'react'

import type { ColumnDef, SortingState } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** 列宽，透传到 th/td 的 style.width */
    width?: number | string
    /** 对齐方式，默认 left */
    align?: 'left' | 'center' | 'right'
  }
}

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

export type DataTableProps<T = Global.AnyObj> = {
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
  pagination?: DataTablePagination
  /** 受控排序状态 */
  sorting?: SortingState
  /** 排序变化回调，由调用方更新状态并重新拉取数据 */
  onSortingChange?: (sorting: SortingState) => void
  className?: string
  style?: CSSProperties
}
```

- [ ] **Step 3: 更新测试文件顶部（列定义 + props 改名）**

将 `test/components/DataTable.test.tsx` 顶部改为（保留 `columns` 定义的语义，但用 ColumnDef 写法）：

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/DataTable'

type User = { id: number; name: string; age: number }

const columns: ColumnDef<User>[] = [
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

并将整个文件中所有 `<DataTable ... dataSource={...}` 改为 `<DataTable ... data={...}`（共 13 处）。

- [ ] **Step 4: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: FAIL——列对齐/宽度用例（`text-center`、`width: 100px`）与自定义空态文案用例（`emptyText` 已不存在）失败，其余渲染用例报错（组件尚未支持新接口）。

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add package.json pnpm-lock.yaml src/components/DataTable/types.ts test/components/DataTable.test.tsx
```

提交信息：

```
feat: DataTable 接入 TanStack 列定义接口

- 新增 @tanstack/react-table 依赖，DataTableProps 改为原生 ColumnDef/data 接口
- 列配置迁移为 accessorKey/cell 写法，测试同步改造
```

---

### Task 2: 重写 DataTable 主组件（TanStack 引擎 + 渲染 + 空态/加载态）

**Files:**

- Modify: `src/components/DataTable/index.tsx`（整体重写）

**Interfaces:**

- Consumes: Task 1 的 `DataTableProps<T>`；`@tanstack/react-table` 的 `useReactTable/getCoreRowModel/flexRender`；`src/ui/Table` 的 Table/TableHeader/TableBody/TableHead/TableRow/TableCell；`src/ui/Empty` 的 Empty/EmptyHeader/EmptyTitle；`src/components/Loading`（default export）；`cn`
- Produces: `DataTable<T>`（具名导出，`export { DataTable }`），`export type { DataTablePagination, DataTableProps } from './types'`

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

并保留「渲染表头与数据单元格」「render 优先于 dataIndex」「rowKey 支持函数形式」三个用例（Task 1 已改 `data`），但「列对齐与宽度映射到表头单元格」用例改为验证 `meta` 映射：

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
Expected: FAIL——组件尚未实现 TanStack 渲染。

- [ ] **Step 3: 实现主组件**

覆盖 `src/components/DataTable/index.tsx`：

```tsx
import type { ReactNode } from 'react'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
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

function DataTable<T = Global.AnyObj>({
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
}: DataTableProps<T>) {
  const isEmpty = data.length === 0
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 0

  const table = useReactTable({
    data: [...data],
    columns,
    getRowId: (record) =>
      typeof rowKey === 'function'
        ? rowKey(record)
        : String((record as Record<string, unknown>)[rowKey]),
    state: {
      ...(pagination
        ? {
            pagination: {
              pageIndex: pagination.page - 1,
              pageSize: pagination.pageSize,
            },
          }
        : {}),
      ...(sorting ? { sorting } : {}),
    },
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater(table.getState().pagination)
          : updater
      pagination?.onChange(next.pageIndex + 1, next.pageSize)
    },
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater(table.getState().sorting)
          : updater
      onSortingChange?.(next)
    },
    getCoreRowModel: getCoreRowModel(),
  })

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
                  const align =
                    (
                      header.column.columnDef.meta as
                        { align?: string } | undefined
                    )?.align ?? 'left'
                  const width = (
                    header.column.columnDef.meta as
                      { width?: number | string } | undefined
                  )?.width
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        alignClassMap[align],
                        header.column.getCanSort() &&
                          'cursor-pointer select-none'
                      )}
                      style={width !== undefined ? { width } : undefined}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (
                        cell.column.columnDef.meta as
                          { align?: string } | undefined
                      )?.align ?? 'left'
                    const width = (
                      cell.column.columnDef.meta as
                        { width?: number | string } | undefined
                    )?.width
                    return (
                      <TableCell
                        key={cell.id}
                        className={alignClassMap[align]}
                        style={width !== undefined ? { width } : undefined}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: PASS——基础渲染、render 优先级、rowKey 函数、meta 映射、loading、空态默认/插槽全部通过。

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/DataTable/index.tsx test/components/DataTable.test.tsx
```

提交信息：

```
feat: DataTable 主组件接入 TanStack 渲染引擎

- useReactTable 接管列渲染与状态，flexRender 渲染表头/单元格
- 列 meta 支持 align/width 映射；可排序列渲染排序图标
- 空态改用 ui/Empty 组合组件，支持 empty 插槽自定义
```

---

### Task 3: 受控排序 + 分页回归

**Files:**

- Modify: `test/components/DataTable.test.tsx`（新增排序用例；分页用例已由 Task 1 改 `data`）
- Modify: `src/components/DataTable/index.tsx`（如需修正）

**Interfaces:**

- Consumes: Task 2 的 `DataTable<T>`；`SortingState` 类型
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

注意：`姓名` 列必须可排序——`ColumnDef` 默认 `enableSorting` 为 true（`manualSorting` 下 `getCanSort()` 仍返回 true），无需额外配置。

- [ ] **Step 2: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/DataTable.test.tsx`
Expected: PASS——若「点击可排序表头」用例失败，检查 `TableHead` 的 `onClick` 是否被正确挂载（TanStack 的 `getToggleSortingHandler` 需要 `manualSorting` 下仍可用）。

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

- Consumes: Task 2/3 的 `DataTable<T>`、`ColumnDef<T>`
- Produces: 无新接口；roles 页面迁移为 ColumnDef 写法并演示排序

- [ ] **Step 1: 更新 roles 页面**

覆盖 `src/pages/system/roles/index.tsx`：

```tsx
import { useState } from 'react'

import type { ColumnDef, SortingState } from '@tanstack/react-table'

import { DataTable } from '@/components/DataTable'

// mock 角色数据：演示 DataTable 使用；接入真实接口后改为 useRequest 拉取
const mockRoles = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  name: `角色${i + 1}`,
  code: `ROLE_${i + 1}`,
  enabled: i % 3 !== 0,
  createdAt: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
}))

type Role = (typeof mockRoles)[number]

const columns: ColumnDef<Role>[] = [
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
feat: roles 页面迁移 TanStack 列定义并演示受控排序

- 列配置改为 accessorKey/cell 写法，状态列保留语义色渲染
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
