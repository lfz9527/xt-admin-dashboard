import { useRequest } from '@/hooks'
import { Confirm } from '@/components/Confirm'
import { deleteDictItem } from '@/service/dict'
import { toast } from '@/ui/Toast'

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
  const { runAsync, loading } = useRequest(deleteDictItem, {
    immediate: false,
  })

  async function onConfirm() {
    if (!node) return
    try {
      await runAsync(Number(node.id))
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const hasChildren = node ? node.children.length > 0 : false
  const subtreeCount = node ? countItemSubtree(node) - 1 : 0

  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
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
      destructive
      confirmText={loading ? '删除中...' : '确认删除'}
      confirmLoading={loading}
      onConfirm={onConfirm}
    />
  )
}
