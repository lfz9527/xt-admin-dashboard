import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

import { DataTable, type DataTableFeatures } from '@/components/DataTable'
import DeleteUserDialog from '@/features/user/components/DeleteUserDialog'
import UserFormDialog from '@/features/user/components/UserFormDialog'
import { useRequest, useDictOptions } from '@/hooks'
import { getUsers, updateUser, type UserItem } from '@/service/users'
import { Button } from '@/ui/Button'
import { Switch } from '@/ui/Switch'
import { toast } from '@/ui/Toast'
import { formatDateTime } from '@/utils/date'

export default function Users() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
  const selectedCount = Object.keys(rowSelection).length
  const { data, loading, error, run, mutate, refresh } = useRequest(getUsers, {
    immediate: false,
  })
  const { runAsync: updateStatusAsync, loading: updateStatusLoading } =
    useRequest(updateUser, {
      immediate: false,
    })
  /** 正在切换状态的用户 id（仅该行显示 loading） */
  const [switchingId, setSwitchingId] = useState<UserItem['id'] | null>(null)
  // 性别回显文案从字典读取，避免写死
  const { labelOf: genderLabelOf } = useDictOptions('sys_user_sex')

  // 行内切换启用/停用：先乐观更新本地列表，接口失败时回滚
  const handleStatusChange = useCallback(
    async (user: UserItem, checked: boolean) => {
      const nextStatus = checked ? 0 : 1
      const prevStatus = user.status
      const applyStatus = (status: number) =>
        mutate((prev) => ({
          ...(prev ?? { list: [], total: 0 }),
          list: (prev?.list ?? []).map((item) =>
            item.id === user.id ? { ...item, status } : item
          ),
        }))
      applyStatus(nextStatus)
      setSwitchingId(user.id)
      try {
        // 后端更新接口 DTO 校验 id 必须为数字，列表返回的字符串 id 需转换
        await updateStatusAsync({
          id: Number(user.id),
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
              loading={updateStatusLoading && switchingId === user.id}
              onCheckedChange={(checked) => handleStatusChange(user, checked)}
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
    [
      handleStatusChange,
      navigate,
      updateStatusLoading,
      switchingId,
      genderLabelOf,
    ]
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
          <>
            {selectedCount > 0 && (
              <>
                <span className='text-muted-foreground self-center text-sm'>
                  已选 {selectedCount} 项
                </span>
                {/* 后端批量删除接口单次最多 50 条，超过时禁用并提示 */}
                {selectedCount > 50 && (
                  <span className='text-muted-foreground self-center text-sm'>
                    单次最多删除 50 条
                  </span>
                )}
                <Button
                  variant='destructive'
                  disabled={selectedCount > 50}
                  onClick={() =>
                    setDeleteTarget({
                      ids: Object.keys(rowSelection).map(Number),
                      names: [],
                    })
                  }
                >
                  批量删除
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setEditingUser(null)
                setFormOpen(true)
              }}
            >
              <Plus className='size-4' />
              新增用户
            </Button>
          </>
        )}
        onRefresh={refresh}
        loading={loading}
        frozenColumns={{ end: ['actions'] }}
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
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSuccess={() => {
          if (editingUser) {
            // 编辑刷新当前页
            run({ page, pageSize })
          } else {
            // 新用户按创建时间排序位置不定，回第 1 页并重新拉取
            setPage(1)
            run({ page: 1, pageSize })
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
          run({ page, pageSize })
        }}
      />
    </div>
  )
}
