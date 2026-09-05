import { useMemo, useState } from 'react'

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { BatchDeleteToolbar } from '@/components/BatchDeleteToolbar'
import { DataTable, type DataTableFeatures } from '@/components/DataTable'
import DeleteRoleDialog from '@/features/role/components/DeleteRoleDialog'
import RoleFormDialog from '@/features/role/components/RoleFormDialog'
import { useOptimisticStatus, usePagedList } from '@/hooks'
import { getRoles, updateRole, type RoleItem } from '@/service/roles'
import { Button } from '@/ui/Button'
import { Switch } from '@/ui/Switch'
import { formatDateTime } from '@/utils/date'

export default function Roles() {
  const [formOpen, setFormOpen] = useState(false)
  /** 正在编辑的角色；null 为新增模式 */
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  /** 待删除角色（id 与名称）；null 表示未打开删除确认弹窗 */
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: number[]
    names: string[]
  } | null>(null)
  /** 表格多选选中行（key 为行 id），供后续批量操作使用 */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const {
    data,
    loading,
    error,
    refresh,
    pagination,
    mutateItems,
    reloadFirstPage,
  } = usePagedList(getRoles)
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).map(Number),
    [rowSelection]
  )
  const {
    handleStatusChange: handleRoleStatusChange,
    isSwitching: isRoleStatusSwitching,
  } = useOptimisticStatus(updateRole, {
    mutateItems,
    getParams: (role, nextStatus) => ({
      id: Number(role.id),
      name: role.name,
      status: nextStatus,
    }),
  })

  const columns = useMemo<ColumnDef<DataTableFeatures, RoleItem>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', meta: { align: 'center', width: 80 } },
      { accessorKey: 'name', header: '角色名称', meta: { width: 120 } },
      {
        accessorKey: 'roleKey',
        header: '角色编码',
        meta: { width: 140 },
      },
      {
        accessorKey: 'status',
        header: '状态',
        meta: { align: 'center', width: 80 },
        cell: ({ row }) => {
          // 后端约定：0=正常（启用）1=停用
          const role = row.original
          return (
            <Switch
              aria-label='切换状态'
              checked={role.status === 0}
              loading={isRoleStatusSwitching(role)}
              onCheckedChange={(checked) =>
                handleRoleStatusChange(role, checked)
              }
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
            {/* 超级管理员角色不允许删除，禁用删除按钮 */}
            <Button
              variant='ghost'
              className='hover:text-destructive text-destructive'
              disabled={row.original.roleKey === 'admin'}
              title={
                row.original.roleKey === 'admin'
                  ? '超级管理员角色不允许删除'
                  : undefined
              }
              onClick={() =>
                setDeleteTarget({
                  ids: [Number(row.original.id)],
                  names: [row.original.name],
                })
              }
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleRoleStatusChange, isRoleStatusSwitching]
  )

  return (
    <div className='flex flex-col gap-3'>
      <DataTable
        columns={columns}
        data={data?.list ?? []}
        rowKey='id'
        selectable
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        title='角色列表'
        toolRender={() => (
          <BatchDeleteToolbar
            selectedIds={selectedIds}
            onDelete={(ids) => setDeleteTarget({ ids, names: [] })}
          >
            <Button
              onClick={() => {
                setEditingRole(null)
                setFormOpen(true)
              }}
            >
              <Plus className='size-4' />
              新增角色
            </Button>
          </BatchDeleteToolbar>
        )}
        onRefresh={refresh}
        loading={loading}
        empty={
          error ? (
            <span className='text-destructive text-sm'>{error.message}</span>
          ) : undefined
        }
        pagination={pagination}
      />
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onSuccess={() => {
          if (editingRole) {
            // 编辑刷新当前页
            refresh()
          } else {
            // 新角色按 sort 排序位置不定，回第 1 页并重新拉取
            reloadFirstPage()
          }
        }}
      />
      <DeleteRoleDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        ids={deleteTarget?.ids ?? []}
        names={deleteTarget?.names ?? []}
        onSuccess={() => {
          // 删除成功后清理选中状态，避免「已选 N 项」残留已删除行
          if (deleteTarget) {
            setRowSelection((prev) => {
              const next = { ...prev }
              deleteTarget.ids.forEach((id) => delete next[String(id)])
              return next
            })
          }
          refresh()
        }}
      />
    </div>
  )
}
