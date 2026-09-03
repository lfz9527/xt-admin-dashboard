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

interface ConfirmProps {
  /** 弹窗是否可见（受控） */
  open: boolean
  /** 可见性变化回调：取消按钮、ESC 关闭等路径统一走此回调 */
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  /** 描述文案；不传时不渲染描述节点 */
  description?: React.ReactNode
  /** 点击确认按钮回调；不自动关闭，由父级在成功后 onOpenChange(false) */
  onConfirm?: () => void
  confirmText?: React.ReactNode
  cancelText?: React.ReactNode
  /** 危险操作样式：确认按钮使用 destructive 变体 */
  destructive?: boolean
  confirmButtonProps?: React.ComponentProps<typeof AlertDialogAction>
  cancelButtonProps?: React.ComponentProps<typeof AlertDialogCancel>
  /** 确认按钮加载态：禁用并显示 Spinner */
  confirmLoading?: boolean
  className?: string
}

function Confirm({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  destructive = false,
  confirmButtonProps,
  cancelButtonProps,
  confirmLoading = false,
  className,
}: ConfirmProps) {
  const {
    variant: confirmVariant,
    disabled: confirmDisabled,
    ...restConfirmButtonProps
  } = confirmButtonProps ?? {}

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel {...cancelButtonProps}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={
              confirmVariant ?? (destructive ? 'destructive' : 'default')
            }
            onClick={onConfirm}
            disabled={confirmLoading || confirmDisabled}
            {...restConfirmButtonProps}
          >
            {confirmLoading ? (
              <>
                <Spinner />
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { Confirm }
export type { ConfirmProps }
