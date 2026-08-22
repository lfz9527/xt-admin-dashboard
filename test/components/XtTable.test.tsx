import { fireEvent, render, screen } from '@testing-library/react'

import { XtTable, type XtColumn } from '@/components/XtTable'

type User = { id: number; name: string; age: number }

const columns: XtColumn<User>[] = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'age', title: '年龄', dataIndex: 'age', align: 'center', width: 100 },
  {
    key: 'action',
    title: '操作',
    render: (_value, record) => `操作-${record.name}`,
  },
]

const users: User[] = [
  { id: 1, name: '张三', age: 18 },
  { id: 2, name: '李四', age: 20 },
]

describe('XtTable', () => {
  it('渲染表头与数据单元格', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
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
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    expect(screen.getByText('操作-张三')).toBeInTheDocument()
  })

  it('rowKey 支持函数形式', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey={(u) => `key-${u.id}`}
      />
    )
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
  })

  it('列对齐与宽度映射到表头单元格', () => {
    const { container } = render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    const th = container.querySelector('th:nth-child(2)')
    expect(th).toHaveClass('text-center')
    expect(th).toHaveStyle({ width: '100px' })
  })
})

describe('XtTable 加载态与空态', () => {
  it('loading 为 true 时显示加载遮罩', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        loading
      />
    )
    expect(screen.getByTestId('xttable-loading')).toBeInTheDocument()
  })

  it('loading 为 false 时不显示遮罩', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />
    )
    expect(screen.queryByTestId('xttable-loading')).not.toBeInTheDocument()
  })

  it('空数据显示默认空态文案', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={[]}
        rowKey='id'
      />
    )
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('支持自定义空态文案', () => {
    render(
      <XtTable
        columns={columns}
        dataSource={[]}
        rowKey='id'
        emptyText='没有数据'
      />
    )
    expect(screen.getByText('没有数据')).toBeInTheDocument()
  })
})

describe('XtTable 分页', () => {
  it('展示总条数与页码', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 42, page: 1, pageSize: 10, onChange }}
      />
    )
    expect(screen.getByText('共 42 条')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('点击下一页触发 onChange', () => {
    const onChange = vi.fn()
    render(
      <XtTable
        columns={columns}
        dataSource={users}
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
      <XtTable
        columns={columns}
        dataSource={users}
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
      <XtTable
        columns={columns}
        dataSource={users}
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
      <XtTable
        columns={columns}
        dataSource={users}
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
      <XtTable
        columns={columns}
        dataSource={users}
        rowKey='id'
        pagination={{ total: 100, page: 5, pageSize: 10, onChange }}
      />
    )
    expect(
      container.querySelectorAll('[data-slot=pagination-ellipsis]')
    ).toHaveLength(2)
  })
})
