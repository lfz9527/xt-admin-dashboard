import { useState } from 'react'

import type { ColumnDef, SortingState } from '@tanstack/react-table'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'

// mock 角色数据：演示 DataTable 使用；接入真实接口后改为 useRequest 拉取
const mockRoles = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  name: `角色${i + 1}`,
  code: `ROLE_${i + 1}`,
  enabled: i % 3 !== 0,
  createdAt: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
}))

type Role = (typeof mockRoles)[number]

const columns: ColumnDef<DataTableFeatures, Role>[] = [
  { accessorKey: 'name', header: '角色名称', enableSorting: true },
  {
    accessorKey: 'code',
    header: '角色编码',
    meta: { width: 140 },
    enableSorting: true,
  },
  {
    accessorKey: 'enabled',
    header: '状态',
    meta: { align: 'center' },
    cell: ({ getValue }) => (
      <span className={getValue() ? 'text-primary' : 'text-muted-foreground'}>
        {getValue() ? '启用' : '停用'}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    meta: { align: 'center', width: 160 },
    enableSorting: true,
  },
]

export default function Roles() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])

  const pageData = mockRoles.slice((page - 1) * pageSize, page * pageSize)

  return (
    <DataTable
      columns={columns}
      data={pageData}
      rowKey='id'
      sorting={sorting}
      onSortingChange={setSorting}
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
