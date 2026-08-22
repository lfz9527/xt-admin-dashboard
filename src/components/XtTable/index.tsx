import type { ReactNode } from 'react'

import Loading from '@/components/Loading'
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
      {loading && (
        <div
          data-testid='xttable-loading'
          className='bg-background/60 absolute inset-0 grid place-items-center'
        >
          <Loading />
        </div>
      )}
    </div>
  )
}

export { XtTable }
export type { XtColumn, XtPagination, XtTableProps } from './types'
