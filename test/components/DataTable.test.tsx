import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import { vi } from 'vitest'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'

type User = { id: number; name: string; age: number }

const columns: ColumnDef<DataTableFeatures, User>[] = [
  { accessorKey: 'name', header: '姓名', enableSorting: true },
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

  it('支持 title 渲染在表格上方', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        title='用户列表'
      />
    )
    const title = screen.getByText('用户列表')
    expect(title).toBeInTheDocument()
    const table = screen.getByRole('table')
    // title 在表格之前（DOM 顺序更靠前）
    expect(
      title.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('未配置 title 时不渲染标题', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
      />
    )
    expect(screen.queryByText('用户列表')).not.toBeInTheDocument()
  })

  it('配置 onRefresh 时显示刷新按钮，点击触发回调', () => {
    const onRefresh = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        onRefresh={onRefresh}
      />
    )
    const refreshBtn = screen.getByRole('button', { name: '刷新' })
    expect(refreshBtn).toBeInTheDocument()
    fireEvent.click(refreshBtn)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('未配置 onRefresh 时不显示刷新按钮', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
      />
    )
    expect(
      screen.queryByRole('button', { name: '刷新' })
    ).not.toBeInTheDocument()
  })

  it('toolRender 自定义内容与默认刷新按钮共存', () => {
    const onRefresh = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        toolRender={() => <button type='button'>导出</button>}
        onRefresh={onRefresh}
      />
    )
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
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

  it('loading 遮罩只覆盖表格容器，表头浮于遮罩之上', () => {
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        loading
      />
    )
    const overlay = screen.getByTestId('datatable-loading')
    // 遮罩位于表格边框容器内（不覆盖标题/分页等外层区域）
    expect(overlay.parentElement?.className).toContain('rounded-md')
    // 表头带背景色与 z-index，视觉上不被遮罩覆盖
    const thead = screen.getAllByRole('rowgroup')[0]
    expect(thead.className).toContain('bg-background')
    expect(thead.className).toContain('z-10')
  })

  it('数据为空且 loading 时表格容器有最小高度', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey='id'
        loading
      />
    )
    // 遮罩父容器（表格边框容器）带 min-h，保证空数据时遮罩有覆盖区域
    const overlay = screen.getByTestId('datatable-loading')
    expect(overlay.parentElement?.className).toContain('min-h-50')
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

  it('展示每页条数选择器并切换触发 onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    await user.click(screen.getByLabelText('每页条数'))
    await user.click(await screen.findByText('20 条/页'))
    expect(onChange).toHaveBeenCalledWith(1, 20)
  })

  it('每页条数可选项可通过 pageSizeOptions 自定义', () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={users}
        rowKey='id'
        pageSizeOptions={[5, 15]}
        pagination={{ total: 42, page: 1, pageSize: 5, onChange }}
      />
    )
    expect(screen.getByText('5 条/页')).toBeInTheDocument()
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

  it('未开启排序的列点击不触发 onSortingChange', () => {
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
    fireEvent.click(screen.getByText('年龄'))
    expect(onSortingChange).not.toHaveBeenCalled()
  })
})

describe('DataTable 冻结列', () => {
  // 冻结列偏移依赖 number 类型 meta.width，此处显式配置以验证累加
  const frozenColumns: ColumnDef<DataTableFeatures, User>[] = [
    { accessorKey: 'name', header: '姓名', meta: { width: 120 } },
    { accessorKey: 'age', header: '年龄', meta: { width: 100 } },
    {
      id: 'action',
      header: '操作',
      cell: ({ row }) => `操作-${row.original.name}`,
    },
  ]

  it('start 冻结列表头与单元格带 sticky 定位与背景色', () => {
    const { container } = render(
      <DataTable
        columns={frozenColumns}
        data={users}
        rowKey='id'
        frozenColumns={{ start: ['name'] }}
      />
    )
    const nameTh = container.querySelector('th:nth-child(1)')
    expect(nameTh).toHaveStyle({
      position: 'sticky',
      left: '0px',
      zIndex: '10',
    })
    expect(nameTh).toHaveClass('bg-background')
    const nameTd = container.querySelector('tbody td:nth-child(1)')
    expect(nameTd).toHaveStyle({ position: 'sticky', left: '0px' })
    expect(nameTd).toHaveClass('bg-background')
    // 未冻结列不带 sticky 定位
    const ageTh = container.querySelector('th:nth-child(2)')
    expect(ageTh).not.toHaveStyle({ position: 'sticky' })
  })

  it('左侧多列冻结时偏移累加前列宽度', () => {
    const { container } = render(
      <DataTable
        columns={frozenColumns}
        data={users}
        rowKey='id'
        frozenColumns={{ start: ['name', 'age'] }}
      />
    )
    const nameTh = container.querySelector('th:nth-child(1)')
    expect(nameTh).toHaveStyle({ left: '0px' })
    const ageTh = container.querySelector('th:nth-child(2)')
    expect(ageTh).toHaveStyle({ left: '120px' })
    const ageTd = container.querySelector('tbody td:nth-child(2)')
    expect(ageTd).toHaveStyle({ left: '120px' })
  })

  it('end 多列冻结时偏移从右往左累加', () => {
    const { container } = render(
      <DataTable
        columns={frozenColumns}
        data={users}
        rowKey='id'
        frozenColumns={{ end: ['name', 'age'] }}
      />
    )
    // end 冻结列被移到表格末尾，DOM 列序变为 [action, name, age]
    const ageTh = container.querySelector('th:nth-child(3)')
    expect(ageTh).toHaveStyle({ position: 'sticky', right: '0px' })
    const nameTh = container.querySelector('th:nth-child(2)')
    expect(nameTh).toHaveStyle({ right: '100px' })
  })

  it('start 与 end 冻结列可同时配置', () => {
    const { container } = render(
      <DataTable
        columns={frozenColumns}
        data={users}
        rowKey='id'
        frozenColumns={{ start: ['name'], end: ['action'] }}
      />
    )
    // start 列移到最前、end 列移到末尾，DOM 列序为 [name, age, action]
    const nameTh = container.querySelector('th:nth-child(1)')
    expect(nameTh).toHaveStyle({ position: 'sticky', left: '0px' })
    const actionTh = container.querySelector('th:nth-child(3)')
    expect(actionTh).toHaveStyle({ position: 'sticky', right: '0px' })
  })

  it('未配置 frozenColumns 时无 sticky 定位', () => {
    const { container } = render(
      <DataTable
        columns={frozenColumns}
        data={users}
        rowKey='id'
      />
    )
    expect(container.querySelector('[data-slot=table-head]')).not.toHaveStyle({
      position: 'sticky',
    })
  })
})
