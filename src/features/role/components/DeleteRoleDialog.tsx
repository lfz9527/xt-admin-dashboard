import { useRequest } from '@/hooks'
import { deleteRole, type RoleItem } from '@/service/roles'
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

type DeleteRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除角色 */
  role: RoleItem | null
}

export default function DeleteRoleDialog({
  open,
  onOpenChange,
  onSuccess,
  role,
}: DeleteRoleDialogProps) {
  const { runAsync, loading } = useRequest(deleteRole, { immediate: false })

  async function onConfirm() {
    if (!role) return
    try {
      await runAsync(role.id)
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
          <DialogTitle>删除角色</DialogTitle>
          <DialogDescription>
            确认删除角色「{role?.name}
            」？删除后其关联用户将变为无角色，该操作不可恢复。
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
