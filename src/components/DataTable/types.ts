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
