import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { deleteBookmark, type BookmarkNode } from '@/service/bookmarks'
import { countTreeSubtree } from '@/utils/tree'

type DeleteBookmarkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除节点 */
  node: BookmarkNode | null
}

export default function DeleteBookmarkDialog({
  open,
  onOpenChange,
  onSuccess,
  node,
}: DeleteBookmarkDialogProps) {
  const isFolder = node?.type === 1
  const subtreeCount = node ? countTreeSubtree(node) - 1 : 0

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      disabled={!node}
      onDelete={(signal) =>
        node
          ? deleteBookmark(Number(node.id), signal)
          : Promise.resolve({ data: null })
      }
      title={isFolder ? '删除文件夹' : '删除收藏'}
      description={
        isFolder ? (
          <>
            确认删除文件夹「{node?.title}
            」？其下 {subtreeCount} 个子项将一并删除，该操作不可恢复。
          </>
        ) : (
          <>
            确认删除收藏「{node?.title}
            」？该操作不可恢复。
          </>
        )
      }
    />
  )
}
