import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { deleteDictItem } from '@/service/dict'

import { countItemSubtree, type DictItemTreeNode } from '../utils'

type DeleteDictItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除字典项节点；null 表示未打开删除确认弹窗 */
  node: DictItemTreeNode | null
}

export default function DeleteDictItemDialog({
  open,
  onOpenChange,
  onSuccess,
  node,
}: DeleteDictItemDialogProps) {
  const hasChildren = node ? node.children.length > 0 : false
  const subtreeCount = node ? countItemSubtree(node) - 1 : 0

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      disabled={!node}
      onDelete={(signal) =>
        node
          ? deleteDictItem(Number(node.id), signal)
          : Promise.resolve({ data: null })
      }
      title='删除字典项'
      description={
        node ? (
          hasChildren ? (
            <>
              确认删除字典项「{node.label}
              」？其下 {subtreeCount} 个子项将一并删除，该操作不可恢复。
            </>
          ) : (
            <>确认删除字典项「{node.label}」？该操作不可恢复。</>
          )
        ) : undefined
      }
    />
  )
}
