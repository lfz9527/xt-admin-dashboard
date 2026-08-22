import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'

type User = { id: number; name: string; age: number }

const columns: ColumnDef<DataTableFeatures, User>[] = [
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

describe('DataTable', () => {
  it('渲染表头与数据单元格', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
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
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
      />
    )
    expect(screen.getByText('操作-张三')).toBeInTheDocument()
  })

  it('rowKey 支持函数形式', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey={(u) => `key-${u.id}`}
      />
    )
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
  })

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
})

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

describe('DataTable 分页', () => {
  it('展示页码', () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('点击下一页触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
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
      <DataTable
        columns={columns}
        data={users}
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
      <DataTable
        columns={columns}
        data={users}
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
      <DataTable
        columns={columns}
        data={users}
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
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        pagination={{ total: 100, page: 5, pageSize: 10, onChange }}
      />
    )
    expect(
      container.querySelectorAll('[data-slot=pagination-ellipsis]')
    ).toHaveLength(2)
  })
})

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
