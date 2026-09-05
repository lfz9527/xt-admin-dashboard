import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { deleteRole, deleteRoles } from '@/service/roles'

type DeleteRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除角色 id 列表（后端 DTO 校验为数字，列表返回的字符串 id 需转换）；单个删除传 1 个元素 */
  ids: number[]
  /** 待删除角色名称（仅单个删除时展示，批量删除只展示数量） */
  names: string[]
}

/** 单个删除走单删接口，批量删除走批量接口 */
function removeRoles(ids: number[], signal?: AbortSignal) {
  return ids.length === 1
    ? deleteRole(ids[0], signal)
    : deleteRoles(ids, signal)
}

export default function DeleteRoleDialog({
  open,
  onOpenChange,
  onSuccess,
  ids,
  names,
}: DeleteRoleDialogProps) {
  const isSingle = ids.length === 1 && names.length === 1

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      disabled={ids.length === 0}
      onDelete={(signal) =>
        ids.length === 0
          ? Promise.resolve({ data: null })
          : removeRoles(ids, signal)
      }
      title={isSingle ? '删除角色' : '批量删除角色'}
      description={
        isSingle ? (
          <>
            确认删除角色「{names[0]}
            」？删除后其关联用户将变为无角色，该操作不可恢复。
          </>
        ) : (
          <>
            确认删除选中的 {ids.length}{' '}
            个角色？删除后其关联用户将变为无角色，该操作不可恢复。
          </>
        )
      }
    />
  )
}
