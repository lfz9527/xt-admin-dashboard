import { useMemo } from 'react'
import {
  columnPinningFeature,
  flexRender,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Cell,
  type ColumnDef,
  type Header,
  type PaginationState,
  type RowData,
} from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  RefreshCwIcon,
} from 'lucide-react'

import Loading from '@/components/Loading'
import { Button } from '@/ui/Button'
import { Checkbox } from '@/ui/Checkbox'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/Empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/Select'
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
  columnPinningFeature,
  rowSelectionFeature,
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

// 内置多选列：header/cell 的 table/row 上下文由 TanStack 渲染时注入，列定义本身无需实例状态
function createSelectColumn<TData extends RowData>(): ColumnDef<
  DataTableFeatures,
  TData
> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label='全选'
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`选择第 ${row.index + 1} 行`}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked, eventDetails) => {
          // handler 读取 event.target.checked（原生 input 语义）与 shiftKey 判断区间连选；
          // Base UI 按钮型 Checkbox 无 checked 属性，需包装事件透传目标值与原生事件
          row.getToggleSelectedHandler()({
            target: { checked },
            shiftKey: (eventDetails.event as MouseEvent).shiftKey,
            nativeEvent: eventDetails.event,
          })
        }}
      />
    ),
    meta: { align: 'center', width: 40 },
  }
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

// 默认不开启排序：仅当列显式配置 enableSorting: true 时才可排序
function canSortColumn<TData extends RowData>(
  header: Header<DataTableFeatures, TData>
) {
  return header.column.columnDef.enableSorting === true
}

// 直接调用 cell 渲染函数获取渲染结果，便于空值占位判断；
// 不可用 flexRender（其为函数时创建 React 元素，返回恒 truthy 无法判空）
function renderCellContent<TData extends RowData, TValue>(
  cell: Cell<DataTableFeatures, TData, TValue>
) {
  const def = cell.column.columnDef.cell
  if (typeof def === 'function') {
    return def(cell.getContext())
  }
  return flexRender(def, cell.getContext())
}

function DataTable<TData extends RowData>({
  columns,
  data,
  rowKey,
  title,
  toolRender,
  onRefresh,
  loading = false,
  empty,
  pagination,
  pageSizeOptions = [10, 20, 50, 100],
  sorting,
  onSortingChange,
  frozenColumns,
  selectable = false,
  rowSelection,
  onRowSelectionChange,
  enableRowSelection,
  className,
  style,
}: DataTableProps<TData>) {
  const isEmpty = data.length === 0
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 0

  // 多选开启时首列插入复选框列；useMemo 保证列数组引用稳定，避免每次渲染重建列定义
  const resolvedColumns = useMemo(
    () => (selectable ? [createSelectColumn<TData>(), ...columns] : columns),
    [columns, selectable]
  )
  // 多选列固定为最左侧冻结列，避免横向滚动时复选框移出可视区
  const frozenStart = selectable
    ? [
        'select',
        ...(frozenColumns?.start ?? []).filter((id) => id !== 'select'),
      ]
    : (frozenColumns?.start ?? [])

  const table = useTable(
    {
      features,
      columns: resolvedColumns,
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
        columnPinning: {
          start: frozenStart,
          end: frozenColumns?.end ?? [],
        },
        rowSelection: rowSelection ?? {},
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
      onRowSelectionChange: (updater) => {
        const next =
          typeof updater === 'function' ? updater(rowSelection ?? {}) : updater
        onRowSelectionChange?.(next)
      },
      ...(enableRowSelection !== undefined ? { enableRowSelection } : {}),
    },
    (state) => ({
      sorting: state.sorting,
      pagination: state.pagination,
      columnPinning: state.columnPinning,
      rowSelection: state.rowSelection,
    })
  )

  // 冻结列 sticky 偏移：start 区从左到右、end 区从右到左累加列宽；
  // 宽度取 meta.width，仅累加 number 类型（string 宽度无法精确求和）
  const pinnedOffsets: Record<string, { left?: number; right?: number }> = {}
  let startWidth = 0
  for (const col of table.getStartVisibleLeafColumns()) {
    pinnedOffsets[col.id] = { left: startWidth }
    const width = col.columnDef.meta?.width
    if (typeof width === 'number') startWidth += width
  }
  let endWidth = 0
  for (const col of [...table.getEndVisibleLeafColumns()].reverse()) {
    pinnedOffsets[col.id] = { ...pinnedOffsets[col.id], right: endWidth }
    const width = col.columnDef.meta?.width
    if (typeof width === 'number') endWidth += width
  }

  // 冻结单元格定位样式：position sticky + 偏移 + z-index（盖住滚动经过的普通单元格）
  const getPinnedStyle = (columnId: string) => {
    const offset = pinnedOffsets[columnId]
    if (!offset) return undefined
    return {
      position: 'sticky' as const,
      zIndex: 10,
      left: offset.left,
      right: offset.right,
    }
  }

  return (
    <div
      className={cn('relative', className)}
      style={style}
    >
      {(title || toolRender || onRefresh) && (
        <div className='my-4 flex items-center justify-between'>
          {title && (
            <div className='cn-font-heading text-base leading-snug font-medium'>
              {title}
            </div>
          )}
          {(toolRender || onRefresh) && (
            <div className='flex items-center gap-2'>
              {toolRender?.()}
              {onRefresh && (
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='刷新'
                  onClick={onRefresh}
                >
                  <RefreshCwIcon className='size-4' />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          'relative overflow-hidden rounded-md border',
          // 加载中数据可能为空（首屏/刷新），给容器最小高度保证遮罩有覆盖区域
          loading && 'min-h-50'
        )}
      >
        <Table>
          <TableHeader className='bg-background relative z-10'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const canSort = canSortColumn(header)
                  const pinnedStyle = getPinnedStyle(header.column.id)
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'whitespace-nowrap',
                        alignClassMap[meta?.align ?? 'left'],
                        canSort && 'cursor-pointer select-none',
                        // 冻结列需要不透明背景，避免横向滚动时透出被覆盖列的内容
                        pinnedStyle && 'bg-background'
                      )}
                      style={{
                        width:
                          meta?.width !== undefined ? meta.width : undefined,
                        ...pinnedStyle,
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className='inline-flex items-center gap-1'>
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                        {canSort &&
                          (header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpIcon className='size-3.5' />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDownIcon className='size-3.5' />
                          ) : (
                            <ChevronsUpDownIcon className='text-muted-foreground/50 size-3.5' />
                          ))}
                      </div>
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
                  colSpan={resolvedColumns.length}
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
                    const pinnedStyle = getPinnedStyle(cell.column.id)
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          alignClassMap[meta?.align ?? 'left'],
                          pinnedStyle && 'bg-background'
                        )}
                        style={{
                          width:
                            meta?.width !== undefined ? meta.width : undefined,
                          ...pinnedStyle,
                        }}
                      >
                        {/* cell 渲染结果为 null/undefined/空字符串时展示默认占位 */}
                        {renderCellContent(cell) || (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {loading && (
          <div
            data-testid='datatable-loading'
            className='bg-background/60 absolute inset-0 grid place-items-center'
          >
            <Loading />
          </div>
        )}
      </div>
      {pagination && !isEmpty && (
        <div className='flex items-center justify-end gap-2 px-1 pt-3'>
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
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              const nextSize = Number(value)
              if (nextSize !== pagination.pageSize) {
                // 是否重置页码由调用方在 onChange 中决定
                pagination.onChange(pagination.page, nextSize)
              }
            }}
          >
            <SelectTrigger
              className='text-muted-foreground h-8 text-sm'
              aria-label='每页条数'
            >
              <SelectValue>{pagination.pageSize} 条/页</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                >
                  {size} 条/页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

export { DataTable }
export type { DataTablePagination, DataTableProps } from './types'
