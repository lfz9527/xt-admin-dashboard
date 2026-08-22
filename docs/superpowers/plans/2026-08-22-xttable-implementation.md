# XtTable 数据驱动表格组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 `src/ui/Table` 封装数据驱动表格组件 `XtTable`（列配置 + 数据源渲染 + 加载态/空态 + 受控分页），放置于 `src/components/XtTable/`。

**Architecture:** XtTable 为纯展示层组件，不发起请求；数据与分页状态由调用方通过 `useRequest` 受控传入。分页条复用 `src/ui/Pagination` 组合式组件，XtTable 负责计算页码序列（含省略号）与边界禁用。

**Tech Stack:** React 19、TypeScript、Tailwind CSS v4 语义化主题变量、Vitest + Testing Library、`@/` 路径别名。

## Global Constraints

- 跨目录导入使用 `@/*` 别名（`@/` 映射 `src/*`）。
- UI 组件使用语义化主题变量（`bg-background`、`text-muted-foreground` 等）与 `cn` 合并类名，保持 `data-slot` 约定。
- 提交信息使用中文，遵循 git-conventions：**每次 `git commit` 前必须通过 AskUserQuestion 让用户确认提交信息**，不可跳过；提交前逐个 `git add` 文件，禁止 `git add .`。
- 每个 Task 完成后运行相关测试；全部完成后运行 `pnpm lint`、`pnpm build`、`pnpm test`。
- 单测运行命令：`pnpm exec vitest run test/components/XtTable.test.tsx`。
- 不新增需求外功能，不做行选择/排序/固定列等高级特性（见 spec YAGNI 节）。

---

### Task 1: XtTable 基础渲染（types + 表头/表体 + render 优先级 + rowKey）

**Files:**

- Create: `src/components/XtTable/types.ts`
- Create: `src/components/XtTable/index.tsx`
- Test: `test/components/XtTable.test.tsx`

**Interfaces:**

- Consumes: `src/ui/Table` 的 `Table/TableHeader/TableBody/TableHead/TableRow/TableCell`（具名导出）
- Produces: `XtTable<T>`（具名导出）、`XtColumn<T>`、`XtPagination`、`XtTableProps<T>`（从 `./types` 再导出）

- [ ] **Step 1: 编写失败测试（渲染列、dataIndex、render 优先级、rowKey、align/width）**

创建 `test/components/XtTable.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react'

import { XtTable } from '@/components/XtTable'
import type { XtColumn } from '@/components/XtTable'

type User = { id: number; name: string; age: number }

const columns: XtColumn<User>[] = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'age', title: '年龄', dataIndex: 'age', align: 'center', width: 100 },
  {
    key: 'action',
    title: '操作',
    render: (_value, record) => `操作-${record.name}`,
  },
]

const users: User[] = [
  { id: 1, name: '张三', age: 18 },
  { id: 2, name: '李四', age: 20 },
]

describe('XtTable', () => {
  it('渲染表头与数据单元格', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    expect(screen.getByText('姓名')).toBeInTheDocument()
    expect(screen.getByText('年龄')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('render 优先于 dataIndex', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    expect(screen.getByText('操作-张三')).toBeInTheDocument()
  })

  it('rowKey 支持函数形式', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey={(u) => `key-${u.id}`}
      />
    )
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
  })

  it('列对齐与宽度映射到表头单元格', () => {
    const { container } = render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    const th = container.querySelector('th:nth-child(2)')
    expect(th).toHaveClass('text-center')
    expect(th).toHaveStyle({ width: '100px' })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: FAIL，报 `Cannot find module '@/components/XtTable'`

- [ ] **Step 3: 创建类型定义**

创建 `src/components/XtTable/types.ts`：

```ts
import type { CSSProperties, ReactNode } from 'react'

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
  style?: CSSProperties
}
```

- [ ] **Step 4: 创建主组件（基础渲染）**

创建 `src/components/XtTable/index.tsx`：

```tsx
import type { ReactNode } from 'react'

import { cn } from '@/utils/common'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/Table'

import type { XtColumn, XtTableProps } from './types'

const alignClassMap: Record<NonNullable<XtColumn['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function XtTable<T = Global.AnyObj>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  pagination,
  className,
  style,
}: XtTableProps<T>) {
  const isEmpty = dataSource.length === 0

  const getRowKey = (record: T) =>
    typeof rowKey === 'function'
      ? rowKey(record)
      : String((record as Record<string, unknown>)[rowKey])

  return (
    <div
      className={cn('relative', className)}
      style={style}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={alignClassMap[col.align ?? 'left']}
                style={
                  col.width !== undefined ? { width: col.width } : undefined
                }
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty && !loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className='text-muted-foreground h-24 text-center'
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            dataSource.map((record, index) => (
              <TableRow key={getRowKey(record)}>
                {columns.map((col) => {
                  const value = col.dataIndex
                    ? (record as Record<string, unknown>)[col.dataIndex]
                    : undefined
                  return (
                    <TableCell
                      key={col.key}
                      className={alignClassMap[col.align ?? 'left']}
                      style={
                        col.width !== undefined
                          ? { width: col.width }
                          : undefined
                      }
                    >
                      {col.render
                        ? col.render(value, record, index)
                        : (value as ReactNode)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { XtTable }
export type { XtColumn, XtPagination, XtTableProps } from './types'
```

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: PASS，4 个用例全部通过

- [ ] **Step 6: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/XtTable/types.ts src/components/XtTable/index.tsx test/components/XtTable.test.tsx
```

提交信息：

```
feat: 新增 XtTable 数据驱动表格基础渲染

- 新增 XtColumn/XtPagination/XtTableProps 类型定义与 XtTable 主组件
- 支持列配置渲染（dataIndex/render 优先级）、rowKey 字符串与函数两种形式
- 列 align/width 映射到表头与单元格样式
```

---

### Task 2: 加载态与空态

**Files:**

- Modify: `src/components/XtTable/index.tsx`（叠加 loading 遮罩，空态逻辑已在 Task 1 内置，需补测试）
- Test: `test/components/XtTable.test.tsx`（追加用例）

**Interfaces:**

- Consumes: Task 1 的 `XtTable<T>`；`src/components/Loading`（default export）
- Produces: 无新接口；`loading` 遮罩容器带 `data-testid='xttable-loading'`

- [ ] **Step 1: 追加失败测试（loading 遮罩、空态默认/自定义文案）**

在 `test/components/XtTable.test.tsx` 末尾追加：

```tsx
describe('XtTable 加载态与空态', () => {
  it('loading 为 true 时显示加载遮罩', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        loading
      />
    )
    expect(screen.getByTestId('xttable-loading')).toBeInTheDocument()
  })

  it('loading 为 false 时不显示遮罩', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    expect(screen.queryByTestId('xttable-loading')).not.toBeInTheDocument()
  })

  it('空数据显示默认空态文案', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={[]}
        rowKey='id'
      />
    )
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('支持自定义空态文案', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={[]}
        rowKey='id'
        emptyText='没有数据'
      />
    )
    expect(screen.getByText('没有数据')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: FAIL，`Unable to find an element by: [data-testid="xttable-loading"]`

- [ ] **Step 3: 实现 loading 遮罩**

修改 `src/components/XtTable/index.tsx`：

顶部导入处增加：

```tsx
import Loading from '@/components/Loading'
```

在 `</Table>` 之后、外层 `</div>` 之前插入：

```tsx
{
  loading && (
    <div
      data-testid='xttable-loading'
      className='bg-background/60 absolute inset-0 grid place-items-center'
    >
      <Loading />
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: PASS，全部用例通过

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/XtTable/index.tsx test/components/XtTable.test.tsx
```

提交信息：

```
feat: XtTable 支持加载遮罩与空态

- loading 时叠加 Loading 遮罩（复用 src/components/Loading），不清空表格内容
- 空数据且非加载时显示跨列空态文案，支持 emptyText 自定义
```

---

### Task 3: 受控分页条

**Files:**

- Modify: `src/components/XtTable/index.tsx`（分页条 + getPageItems 工具函数）
- Test: `test/components/XtTable.test.tsx`（追加用例）

**Interfaces:**

- Consumes: Task 1 的 `XtTable<T>`/`XtPagination`；`src/ui/Pagination` 的 `Pagination/PaginationContent/PaginationEllipsis/PaginationItem/PaginationLink/PaginationNext/PaginationPrevious`
- Produces: 模块内私有函数 `getPageItems(page: number, totalPages: number): (number | 'ellipsis')[]`（不导出）

- [ ] **Step 1: 追加失败测试（总数展示、翻页触发 onChange、边界禁用、省略号）**

在 `test/components/XtTable.test.tsx` 末尾追加：

```tsx
describe('XtTable 分页', () => {
  it('展示总条数与页码', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    expect(screen.getByText('共 42 条')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('点击下一页触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    fireEvent.click(screen.getByLabelText('Go to next page'))
    expect(onChange).toHaveBeenCalledWith(2, 10)
  })

  it('点击页码触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 42, page: 2, pageSize: 10, onChange }}
      />
    )
    fireEvent.click(screen.getByText('3'))
    expect(onChange).toHaveBeenCalledWith(3, 10)
  })

  it('首页时上一页不触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    fireEvent.click(screen.getByLabelText('Go to previous page'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('末页时下一页不触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 20, page: 2, pageSize: 10, onChange }}
      />
    )
    fireEvent.click(screen.getByLabelText('Go to next page'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('页码较多时折叠为省略号', () => {
    const onChange = vi.fn()
    const { container } = render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 100, page: 5, pageSize: 10, onChange }}
      />
    )
    expect(
      container.querySelectorAll('[data-slot=pagination-ellipsis]')
    ).toHaveLength(2)
  })
})
```

同时更新文件顶部导入（Task 1 的测试文件开头缺少 `fireEvent`）：

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: FAIL，`Unable to find an element by: [data-testid=...]` 或找不到「共 42 条」

- [ ] **Step 3: 实现分页条与页码序列**

修改 `src/components/XtTable/index.tsx`：

顶部导入处增加：

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/Pagination'
```

在 `alignClassMap` 之后新增私有函数：

```tsx
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
```

组件函数体开头（`const isEmpty` 之后）新增：

```tsx
const totalPages = pagination
  ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  : 0
```

在 loading 遮罩 `</div>` 之后、外层 `</div>` 之前插入：

```tsx
{
  pagination && !isEmpty && (
    <div className='flex items-center justify-between px-1 pt-3'>
      <span className='text-muted-foreground text-sm'>
        共 {pagination.total} 条
      </span>
      <Pagination className='ml-auto'>
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
                  pagination.onChange(pagination.page - 1, pagination.pageSize)
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
                  pagination.onChange(pagination.page + 1, pagination.pageSize)
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run test/components/XtTable.test.tsx`
Expected: PASS，全部用例通过

- [ ] **Step 5: 提交（先 AskUserQuestion 向用户确认提交信息，确认后执行）**

```bash
git add src/components/XtTable/index.tsx test/components/XtTable.test.tsx
```

提交信息：

```
feat: XtTable 集成受控分页条

- 复用 src/ui/Pagination 组合式组件，分页状态由调用方受控
- 内置 getPageItems 页码序列计算，>7 页时折叠省略号
- 首页/末页禁用对应翻页按钮并拦截 onChange
```

---

### Task 4: 全量校验

**Files:**

- 无新增/修改

- [ ] **Step 1: 运行全部测试**

Run: `pnpm test`
Expected: PASS，全部测试文件通过

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`
Expected: 无 error

- [ ] **Step 3: 运行构建**

Run: `pnpm build`
Expected: TypeScript 检查通过，Vite 构建成功

- [ ] **Step 4: 检查工作区状态并确认无遗漏**

Run: `git status`
Expected: 工作区干净（无未提交变更）
