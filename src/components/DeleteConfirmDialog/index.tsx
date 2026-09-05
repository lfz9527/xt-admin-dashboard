import { useCallback } from 'react'

import { Confirm } from '@/components/Confirm'
import { useLatest, useRequest, type ServiceFn } from '@/hooks'
import { toast } from '@/ui/Toast'

type DeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 删除成功回调，父级用于刷新列表 */
  onSuccess: () => void
  /** 删除请求；signal 由公共组件注入，便于请求在组件卸载时取消 */
  onDelete: ServiceFn<unknown, []>
  title: React.ReactNode
  description?: React.ReactNode
  confirmText?: React.ReactNode
  disabled?: boolean
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onSuccess,
  onDelete,
  title,
  description,
  confirmText = '确认删除',
  disabled = false,
}: DeleteConfirmDialogProps) {
  const onDeleteRef = useLatest(onDelete)
  const { runAsync, loading } = useRequest(
    useCallback((signal?: AbortSignal) => onDeleteRef.current(signal), []),
    { immediate: false }
  )

  async function handleConfirm() {
    if (disabled) return
    try {
      await runAsync()
      toast.success('删除成功')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      destructive
      confirmText={loading ? '删除中...' : confirmText}
      confirmLoading={loading}
      confirmButtonProps={{ disabled }}
      onConfirm={handleConfirm}
    />
  )
}

export { DeleteConfirmDialog }
export type { DeleteConfirmDialogProps }
