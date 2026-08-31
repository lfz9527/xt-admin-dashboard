import type { CSSProperties, ReactNode } from 'react'

import type {
  ColumnDef,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'

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

type DataTableBaseProps<TData extends RowData = Global.AnyObj> = {
  /** TanStack 原生列定义（携带组件导出的 DataTableFeatures 泛型） */
  columns: ColumnDef<DataTableFeatures, TData>[]
  /** 数据源 */
  data: readonly TData[]
  /** 行唯一标识：字段名或返回唯一值的函数，映射 TanStack getRowId */
  rowKey: string | ((record: TData) => string)
  /** 表格标题，渲染在表格上方左侧 */
  title?: ReactNode
  /** 表格上方右侧自定义渲染（与默认刷新按钮共存） */
  toolRender?: () => ReactNode
  /** 配置后表格上方右侧显示默认刷新按钮，点击仅调用该回调 */
  onRefresh?: () => void
  /** 加载态，true 时表格区域叠加 Loading 遮罩 */
  loading?: boolean
  /** 空态插槽，缺省时内置 Empty + EmptyTitle「暂无数据」 */
  empty?: ReactNode
  /** 受控分页，传入即显示底部分页条 */
  pagination?: DataTablePagination
  /** 每页条数可选项，默认 [10, 20, 50, 100]；切换时 onChange(page, newSize)，是否重置页码由调用方决定 */
  pageSizeOptions?: number[]
  /** 受控排序状态 */
  sorting?: SortingState
  /** 排序变化回调，由调用方更新状态并重新拉取数据 */
  onSortingChange?: (sorting: SortingState) => void
  /** 冻结列配置：start 为左侧冻结列 id 列表，end 为右侧冻结列 id 列表；冻结列需配置 number 类型的 meta.width 以保证偏移计算 */
  frozenColumns?: { start?: string[]; end?: string[] }
  className?: string
  style?: CSSProperties
}

/** 非多选模式：不允许传入多选相关 props */
type DataTableNonSelectableProps = {
  selectable?: false
  rowSelection?: never
  onRowSelectionChange?: never
  enableRowSelection?: never
}

/** 多选模式：selectable 与受控选中状态必须成对出现，避免复选框可见但无响应 */
type DataTableSelectableProps<TData extends RowData> = {
  selectable: true
  /** 多选选中状态（受控），key 为行 id（rowKey 映射值） */
  rowSelection: RowSelectionState
  /** 选中状态变化回调（受控），与 rowSelection 成对使用 */
  onRowSelectionChange: (selection: RowSelectionState) => void
  /** 行可选控制：布尔值或按行判断的函数，默认全部行可选 */
  enableRowSelection?:
    boolean | ((row: Row<DataTableFeatures, TData>) => boolean)
}

export type DataTableProps<TData extends RowData = Global.AnyObj> =
  DataTableBaseProps<TData> &
    (DataTableNonSelectableProps | DataTableSelectableProps<TData>)
