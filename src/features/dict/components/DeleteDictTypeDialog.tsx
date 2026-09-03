import { useRequest } from '@/hooks'
import { Confirm } from '@/components/Confirm'
import { deleteDictType, type DictTypeItem } from '@/service/dict'
import { toast } from '@/ui/Toast'

type DeleteDictTypeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除字典类型；null 表示未打开删除确认弹窗 */
  type: DictTypeItem | null
}

export default function DeleteDictTypeDialog({
  open,
  onOpenChange,
  onSuccess,
  type,
}: DeleteDictTypeDialogProps) {
  const { runAsync, loading } = useRequest(deleteDictType, {
    immediate: false,
  })

  async function onConfirm() {
    if (!type) return
    try {
      await runAsync(Number(type.id))
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title='删除字典类型'
      description={
        type ? (
          <>
            确认删除字典类型「{type.name}
            」？其下全部字典项将一并删除，该操作不可恢复。
          </>
        ) : undefined
      }
      destructive
      confirmText={loading ? '删除中...' : '确认删除'}
      confirmLoading={loading}
      onConfirm={onConfirm}
    />
  )
}
