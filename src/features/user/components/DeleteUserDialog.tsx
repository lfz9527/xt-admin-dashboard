import { useRequest } from '@/hooks'
import { deleteUser, type UserItem } from '@/service/users'
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
  /** 待删除用户 */
  user: UserItem | null
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  onSuccess,
  user,
}: DeleteUserDialogProps) {
  const { runAsync, loading } = useRequest(deleteUser, { immediate: false })

  async function onConfirm() {
    if (!user) return
    try {
      // 后端删除接口 DTO 校验 id 必须为数字，列表返回的字符串 id 需转换
      await runAsync(Number(user.id))
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除用户</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除用户「{user?.nickname}
            」？删除后该用户将无法登录，该操作不可恢复。
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
