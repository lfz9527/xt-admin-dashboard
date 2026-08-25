import { useRequest } from '@/hooks'
import { deleteUser, type UserItem } from '@/service/users'
import { Button } from '@/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/Dialog'
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
      await runAsync(user.id)
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>删除用户</DialogTitle>
          <DialogDescription>
            确认删除用户「{user?.nickname}
            」？删除后该用户将无法登录，该操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
