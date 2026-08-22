import type { CSSProperties, ReactNode } from 'react'

export type DataTableColumn<T = Global.AnyObj> = {
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

export type DataTablePagination = {
  /** 数据总条数 */
  total: number
  /** 当前页码，从 1 开始 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 翻页回调，由调用方更新状态并重新拉取数据 */
  onChange: (page: number, pageSize: number) => void
}

export type DataTableProps<T = Global.AnyObj> = {
  columns: DataTableColumn<T>[]
  dataSource: readonly T[]
  /** 行唯一标识：字段名或返回唯一值的函数 */
  rowKey: string | ((record: T) => string)
  /** 加载态，true 时表格区域叠加 Loading 遮罩 */
  loading?: boolean
  /** 空态文案，默认「暂无数据」 */
  emptyText?: ReactNode
  /** 传入即显示底部受控分页条 */
  pagination?: DataTablePagination
  className?: string
  style?: CSSProperties
}
