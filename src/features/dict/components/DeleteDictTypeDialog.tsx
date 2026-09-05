import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { deleteDictType, type DictTypeItem } from '@/service/dict'

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
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      disabled={!type}
      onDelete={(signal) =>
        type
          ? deleteDictType(Number(type.id), signal)
          : Promise.resolve({ data: null })
      }
      title='删除字典类型'
      description={
        type ? (
          <>
            确认删除字典类型「{type.name}
            」？其下全部字典项将一并删除，该操作不可恢复。
          </>
        ) : undefined
      }
    />
  )
}
