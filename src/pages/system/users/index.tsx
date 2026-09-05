import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { BatchDeleteToolbar } from '@/components/BatchDeleteToolbar'
import { DataTable, type DataTableFeatures } from '@/components/DataTable'
import DeleteUserDialog from '@/features/user/components/DeleteUserDialog'
import UserFormDialog from '@/features/user/components/UserFormDialog'
import { useDictOptions, useOptimisticStatus, usePagedList } from '@/hooks'
import { getUsers, updateUser, type UserItem } from '@/service/users'
import { Button } from '@/ui/Button'
import { Switch } from '@/ui/Switch'
import { formatDateTime } from '@/utils/date'

export default function Users() {
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  /** 正在编辑的用户；null 为新增模式 */
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  /** 待删除用户（id 与昵称）；null 表示未打开删除确认弹窗 */
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: number[]
    names: string[]
  } | null>(null)
  /** 表格多选选中行（key 为行 id），供批量删除使用 */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const {
    data,
    loading,
    error,
    refresh,
    pagination,
    mutateItems,
    reloadFirstPage,
  } = usePagedList(getUsers)
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).map(Number),
    [rowSelection]
  )
  const {
    handleStatusChange: handleUserStatusChange,
    isSwitching: isUserStatusSwitching,
  } = useOptimisticStatus(updateUser, {
    mutateItems,
    getParams: (user, nextStatus) => ({
      id: Number(user.id),
      status: nextStatus,
    }),
  })
  // 性别回显文案从字典读取，避免写死
  const { labelOf: genderLabelOf } = useDictOptions('sys_user_sex')

  const columns = useMemo<ColumnDef<DataTableFeatures, UserItem>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', meta: { align: 'center', width: 80 } },
      { accessorKey: 'nickname', header: '昵称', meta: { width: 120 } },
      { accessorKey: 'email', header: '邮箱', meta: { width: 200 } },
      {
        accessorKey: 'gender',
        header: '性别',
        meta: { align: 'center', width: 80 },
        cell: ({ getValue }) => genderLabelOf(getValue() as number) ?? '-',
      },
      {
        accessorKey: 'role',
        header: '角色',
        meta: { align: 'center', width: 120 },
        cell: ({ getValue }) => {
          const role = getValue() as UserItem['role']
          return role ? (
            role.name
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: '状态',
        meta: { align: 'center', width: 80 },
        cell: ({ row }) => {
          // 后端约定：0=正常（启用）1=停用
          const user = row.original
          return (
            <Switch
              aria-label='切换状态'
              checked={user.status === 0}
              loading={isUserStatusSwitching(user)}
              onCheckedChange={(checked) =>
                handleUserStatusChange(user, checked)
              }
            />
          )
        },
      },
      {
        accessorKey: 'lastLoginTime',
        header: '最后登录',
        meta: { align: 'center', width: 160 },
        cell: ({ getValue }) => {
          const time = getValue() as UserItem['lastLoginTime']
          return time ? formatDateTime(time) : '从未登录'
        },
      },
      {
        accessorKey: 'lastLoginIp',
        header: '最后登录IP',
        meta: { align: 'center', width: 130 },
        cell: ({ getValue }) => {
          // 空值（undefined/null/空字符串）由 DataTable 统一渲染默认占位
          const ip = getValue() as UserItem['lastLoginIp']
          return ip
        },
      },
      {
        accessorKey: 'createdAt',
        header: '注册时间',
        meta: { align: 'center', width: 160 },
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
      {
        id: 'actions',
        header: '操作',
        meta: { align: 'center', width: 160 },
        cell: ({ row }) => (
          <div className='flex justify-center gap-1'>
            <Button
              variant='ghost'
              onClick={() => navigate(`/system/users/${row.original.id}`)}
            >
              查看
            </Button>
            <Button
              variant='ghost'
              onClick={() => {
                setEditingUser(row.original)
                setFormOpen(true)
              }}
            >
              编辑
            </Button>
            <Button
              variant='ghost'
              className='hover:text-destructive text-destructive'
              disabled={row.original.role?.roleKey === 'admin'}
              title={
                row.original.role?.roleKey === 'admin'
                  ? '超级管理员用户不允许删除'
                  : undefined
              }
              onClick={() =>
                setDeleteTarget({
                  ids: [Number(row.original.id)],
                  names: [row.original.nickname],
                })
              }
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleUserStatusChange, isUserStatusSwitching, navigate, genderLabelOf]
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
        title='用户列表'
        toolRender={() => (
          <BatchDeleteToolbar
            selectedIds={selectedIds}
            onDelete={(ids) => setDeleteTarget({ ids, names: [] })}
          >
            <Button
              onClick={() => {
                setEditingUser(null)
                setFormOpen(true)
              }}
            >
              <Plus className='size-4' />
              新增用户
            </Button>
          </BatchDeleteToolbar>
        )}
        onRefresh={refresh}
        loading={loading}
        frozenColumns={{ end: ['actions'] }}
        empty={
          error ? (
            <span className='text-destructive text-sm'>{error.message}</span>
          ) : undefined
        }
        pagination={pagination}
      />
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSuccess={() => {
          if (editingUser) {
            // 编辑刷新当前页
            refresh()
          } else {
            // 新用户按创建时间排序位置不定，回第 1 页并重新拉取
            reloadFirstPage()
          }
        }}
      />
      <DeleteUserDialog
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
