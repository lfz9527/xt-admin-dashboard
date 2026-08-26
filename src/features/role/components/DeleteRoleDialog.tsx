import { useRequest } from '@/hooks'
import { deleteRole, type RoleItem } from '@/service/roles'
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
      // 后端删除接口 DTO 校验 id 必须为数字，列表返回的字符串 id 需转换
      await runAsync(Number(role.id))
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
          <AlertDialogTitle>删除角色</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除角色「{role?.name}
            」？删除后其关联用户将变为无角色，该操作不可恢复。
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
