import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/ui/Sheet'
import { cn } from '@/utils/common'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  side?: 'left' | 'right' | 'top' | 'bottom'
  full?: boolean
  closable?: boolean
  maskClosable?: boolean
  className?: string
}

function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  side = 'right',
  full = false,
  closable = true,
  maskClosable = true,
  className,
}: DrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!maskClosable}
    >
      <SheetContent
        side={side}
        full={full}
        showCloseButton={closable}
        className={className}
      >
        {title && (
          <SheetHeader className='border-b'>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        )}
        <div className={cn('flex-1 overflow-auto p-4', !title && 'pt-0')}>
          {children}
        </div>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

export { Drawer }
export type { DrawerProps }
