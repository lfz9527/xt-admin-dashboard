import { useRequest } from '@/hooks'
import { deleteUser, deleteUsers } from '@/service/users'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/AlertDialog'
import { Spinner } from '@/ui/Spinner'
import { toast } from '@/ui/Toast'

type DeleteUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除用户 id 列表（后端 DTO 校验为数字，列表返回的字符串 id 需转换）；单个删除传 1 个元素 */
  ids: number[]
  /** 待删除用户昵称（仅单个删除时展示，批量删除只展示数量） */
  names: string[]
}

/** 单个删除走单删接口，批量删除走批量接口 */
function removeUsers(ids: number[], signal?: AbortSignal) {
  return ids.length === 1
    ? deleteUser(ids[0], signal)
    : deleteUsers(ids, signal)
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  onSuccess,
  ids,
  names,
}: DeleteUserDialogProps) {
  const { runAsync, loading } = useRequest(removeUsers, { immediate: false })

  async function onConfirm() {
    if (ids.length === 0) return
    try {
      await runAsync(ids)
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const isSingle = ids.length === 1 && names.length === 1

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSingle ? '删除用户' : '批量删除用户'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSingle ? (
              <>
                确认删除用户「{names[0]}
                」？删除后该用户将无法登录，该操作不可恢复。
              </>
            ) : (
              <>
                确认删除选中的 {ids.length}{' '}
                个用户？删除后这些用户将无法登录，该操作不可恢复。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
