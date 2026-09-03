import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/Dialog'
import { Button } from '@/ui/Button'
import { Spinner } from '@/ui/Spinner'
import { cn } from '@/utils/common'

interface ModalProps {
  /** 弹窗是否可见（受控） */
  open: boolean
  /** 点击确认按钮回调 */
  onOk?: () => void
  /** 取消按钮、右上角关闭按钮、点击蒙版、ESC 关闭时统一回调 */
  onCancel?: () => void
  title?: React.ReactNode
  /** 底部内容；传 null 隐藏底部，默认渲染「取消 / 确认」按钮 */
  footer?: React.ReactNode
  okText?: React.ReactNode
  cancelText?: React.ReactNode
  okButtonProps?: React.ComponentProps<typeof Button>
  cancelButtonProps?: React.ComponentProps<typeof Button>
  /** 确认按钮加载态：禁用并显示 Spinner */
  confirmLoading?: boolean
  /** 是否显示右上角关闭按钮 */
  closable?: boolean
  /** 点击蒙版是否关闭 */
  maskClosable?: boolean
  /** 弹窗宽度；不传时保持 Dialog 默认宽度 */
  width?: number | string
  /** 打开/关闭动画结束后的回调 */
  afterOpenChange?: (open: boolean) => void
  className?: string
  children: React.ReactNode
}

function Modal({
  open,
  onOk,
  onCancel,
  title,
  footer,
  okText = '确认',
  cancelText = '取消',
  okButtonProps,
  cancelButtonProps,
  confirmLoading = false,
  closable = true,
  maskClosable = true,
  width,
  afterOpenChange,
  className,
  children,
}: ModalProps) {
  const defaultFooter = (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={onCancel}
        {...cancelButtonProps}
      >
        {cancelText}
      </Button>
      <Button
        type='button'
        onClick={onOk}
        disabled={confirmLoading}
        {...okButtonProps}
      >
        {confirmLoading ? (
          <>
            <Spinner />
            {okText}
          </>
        ) : (
          okText
        )}
      </Button>
    </>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel?.()
      }}
      onOpenChangeComplete={afterOpenChange}
      disablePointerDismissal={!maskClosable}
    >
      <DialogContent
        showCloseButton={closable}
        style={width != null ? { width } : undefined}
        className={cn(width != null && 'sm:max-w-none', className)}
      >
        {title != null && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
        {footer !== null && (
          <DialogFooter>{footer ?? defaultFooter}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { Modal }
export type { ModalProps }
