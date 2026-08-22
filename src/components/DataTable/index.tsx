import {
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type RowData,
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
