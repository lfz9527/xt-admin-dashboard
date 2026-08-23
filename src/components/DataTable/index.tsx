import {
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
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

// 默认不开启排序：仅当列显式配置 enableSorting: true 时才可排序
function canSortColumn<TData extends RowData>(
  header: Header<DataTableFeatures, TData>
) {
  return header.column.columnDef.enableSorting === true
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
          'relative rounded-md border',
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
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        alignClassMap[meta?.align ?? 'left'],
                        canSort && 'cursor-pointer select-none'
                      )}
                      style={
                        meta?.width !== undefined
                          ? { width: meta.width }
                          : undefined
                      }
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
