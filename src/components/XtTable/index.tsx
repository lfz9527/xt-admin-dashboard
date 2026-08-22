import type { ReactNode } from 'react'

import Loading from '@/components/Loading'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/Pagination'
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
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 0

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
      {loading && (
        <div
          data-testid='xttable-loading'
          className='bg-background/60 absolute inset-0 grid place-items-center'
        >
          <Loading />
        </div>
      )}
      {pagination && !isEmpty && (
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

export { XtTable }
export type { XtColumn, XtPagination, XtTableProps } from './types'
