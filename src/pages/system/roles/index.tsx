import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'
import DeleteRoleDialog from '@/features/role/components/DeleteRoleDialog'
import RoleFormDialog from '@/features/role/components/RoleFormDialog'
import { useRequest } from '@/hooks'
import { getRoles, updateRole, type RoleItem } from '@/service/roles'
import { Button } from '@/ui/Button'
import { Switch } from '@/ui/Switch'
import { toast } from '@/ui/Toast'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Roles() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  /** 正在编辑的角色；null 为新增模式 */
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null)
  const { data, loading, error, run, mutate } = useRequest(getRoles, {
    immediate: false,
  })
  const { runAsync: updateStatusAsync, loading: updateStatusLoading } =
    useRequest(updateRole, {
      immediate: false,
    })
  /** 正在切换状态的角色 id（仅该行显示 loading） */
  const [switchingId, setSwitchingId] = useState<RoleItem['id'] | null>(null)

  // 行内切换启用/停用：先乐观更新本地列表，接口失败时回滚
  const handleStatusChange = useCallback(
    async (role: RoleItem, checked: boolean) => {
      const nextStatus = checked ? 0 : 1
      const prevStatus = role.status
      const applyStatus = (status: number) =>
        mutate((prev) => ({
          ...(prev ?? { list: [], total: 0 }),
          list: (prev?.list ?? []).map((item) =>
            item.id === role.id ? { ...item, status } : item
          ),
        }))
      applyStatus(nextStatus)
      setSwitchingId(role.id)
      try {
        // 列表返回的 id 为字符串，需转数字
        await updateStatusAsync({
          id: Number(role.id),
          name: role.name,
          status: nextStatus,
        })
        toast.success('状态更新成功')
      } catch (err) {
        applyStatus(prevStatus)
        toast.error((err as Error).message)
      } finally {
        setSwitchingId(null)
      }
    },
    [mutate, updateStatusAsync]
  )

  useEffect(() => {
    run({ page, pageSize })
  }, [page, pageSize, run])

  // 删除后当前页变空且不是第 1 页时回退，避免停留在空页
  useEffect(() => {
    if (data && data.list.length === 0 && data.total > 0 && page > 1) {
      setPage(1)
    }
  }, [data, page])

  const columns = useMemo<ColumnDef<DataTableFeatures, RoleItem>[]>(
    () => [
      { accessorKey: 'name', header: '角色名称' },
      {
        accessorKey: 'roleKey',
        header: '角色编码',
        meta: { width: 140 },
      },
      {
        accessorKey: 'status',
        header: '状态',
        meta: { align: 'center' },
        cell: ({ row }) => {
          // 后端约定：0=正常（启用）1=停用
          const role = row.original
          return (
            <Switch
              aria-label='切换状态'
              checked={role.status === 0}
              loading={updateStatusLoading && switchingId === role.id}
              onCheckedChange={(checked) => handleStatusChange(role, checked)}
            />
          )
        },
      },
      {
        accessorKey: 'remark',
        header: '备注',
        cell: ({ getValue }) => {
          const remark = getValue() as string
          return remark ? (
            remark
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: '创建时间',
        meta: { align: 'center', width: 160 },
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
      {
        id: 'actions',
        header: '操作',
        meta: { align: 'center', width: 110 },
        cell: ({ row }) => (
          <div className='flex justify-center gap-1'>
            <Button
              variant='ghost'
              onClick={() => {
                setEditingRole(row.original)
                setFormOpen(true)
              }}
            >
              编辑
            </Button>
            <Button
              variant='ghost'
              className='hover:text-destructive text-destructive'
              onClick={() => setDeleteTarget(row.original)}
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleStatusChange, updateStatusLoading, switchingId]
  )

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-end'>
        <Button
          onClick={() => {
            setEditingRole(null)
            setFormOpen(true)
          }}
        >
          <Plus className='size-4' />
          新增角色
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data?.list ?? []}
        rowKey='id'
        loading={loading}
        empty={
          error ? (
            <span className='text-destructive text-sm'>{error.message}</span>
          ) : undefined
        }
        pagination={{
          total: data?.total ?? 0,
          page,
          pageSize,
          onChange: (nextPage, nextPageSize) => {
            // 切换每页条数时回到第 1 页（业务决定，组件不干预）
            const isSizeChanged = nextPageSize !== pageSize
            setPage(isSizeChanged ? 1 : nextPage)
            setPageSize(nextPageSize)
          },
        }}
      />
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onSuccess={() => {
          if (editingRole) {
            // 编辑刷新当前页
            run({ page, pageSize })
          } else {
            // 新角色按 sort 排序位置不定，回第 1 页并重新拉取
            setPage(1)
            run({ page: 1, pageSize })
          }
        }}
      />
      <DeleteRoleDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        role={deleteTarget}
        onSuccess={() => run({ page, pageSize })}
      />
    </div>
  )
}
