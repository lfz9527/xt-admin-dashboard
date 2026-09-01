import { useRequest } from '@/hooks'
import { deleteBookmark, type BookmarkNode } from '@/service/bookmarks'
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

type DeleteBookmarkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 待删除节点 */
  node: BookmarkNode | null
}

/** 统计节点及其全部子孙数量 */
function countSubtree(node: BookmarkNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countSubtree(child), 0)
}

export default function DeleteBookmarkDialog({
  open,
  onOpenChange,
  onSuccess,
  node,
}: DeleteBookmarkDialogProps) {
  const { runAsync, loading } = useRequest(deleteBookmark, {
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

  const isFolder = node?.type === 1
  const subtreeCount = node ? countSubtree(node) - 1 : 0

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isFolder ? '删除文件夹' : '删除收藏'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isFolder ? (
              <>
                确认删除文件夹「{node?.title}
                」？其下 {subtreeCount} 个子项将一并删除，该操作不可恢复。
              </>
            ) : (
              <>
                确认删除收藏「{node?.title}
                」？该操作不可恢复。
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
