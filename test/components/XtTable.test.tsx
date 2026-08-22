import { render, screen } from '@testing-library/react'

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
