import { Modal } from '@/components/Modal'

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  formId: string
  loading?: boolean
  submitText?: React.ReactNode
  loadingText?: React.ReactNode
  cancelText?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function FormDialog({
  open,
  onOpenChange,
  title,
  formId,
  loading = false,
  submitText = '确认',
  loadingText = '提交中...',
  cancelText = '取消',
  className,
  children,
}: FormDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={() => onOpenChange(false)}
      confirmLoading={loading}
      okText={loading ? loadingText : submitText}
      cancelText={cancelText}
      okButtonProps={{ type: 'submit', form: formId }}
      className={className}
    >
      {children}
    </Modal>
  )
}

export { FormDialog }
export type { FormDialogProps }
