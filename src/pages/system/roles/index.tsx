import { useState } from 'react'

import { XtTable, type XtColumn } from '@/components/XtTable'

// mock 角色数据：演示 XtTable 使用；接入真实接口后改为 useRequest 拉取
const mockRoles = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  name: `角色${i + 1}`,
  code: `ROLE_${i + 1}`,
  enabled: i % 3 !== 0,
  createdAt: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
}))

type Role = (typeof mockRoles)[number]

const columns: XtColumn<Role>[] = [
  { key: 'name', title: '角色名称', dataIndex: 'name' },
  { key: 'code', title: '角色编码', dataIndex: 'code', width: 140 },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'enabled',
    align: 'center',
    render: (value) => (
      <span className={value ? 'text-primary' : 'text-muted-foreground'}>
        {value ? '启用' : '停用'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    title: '创建时间',
    dataIndex: 'createdAt',
    align: 'center',
    width: 160,
  },
]

export default function Roles() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const pageData = mockRoles.slice((page - 1) * pageSize, page * pageSize)

  return (
    <XtTable
      columns={columns}
      dataSource={pageData}
      rowKey='id'
      pagination={{
        total: mockRoles.length,
        page,
        pageSize,
        onChange: (nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        },
      }}
    />
  )
}
