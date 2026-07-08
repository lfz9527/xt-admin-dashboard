import { useState, useCallback, isValidElement } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/Collapsible'
import { cn } from '@/utils/common'

interface CollapseProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
  className?: string

  trigger?: React.ReactNode
  triggerCls?: string

  wrapper?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  keepMounted?: boolean

  arrow?: React.ReactNode
  arrowCls?: string
}

function Collapse({
  title,
  children,
  defaultOpen = false,
  disabled = false,
  className,
  trigger,
  triggerCls,
  wrapper,
  open: controlledOpen,
  onOpenChange,
  keepMounted = true,
  arrow,
  arrowCls,
}: CollapseProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const currentOpen = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && disabled && defaultOpen) return
      if (open && disabled) return

      if (isControlled) {
        onOpenChange?.(open)
        return
      }

      setInternalOpen(open)
    },
    [disabled, defaultOpen, isControlled, onOpenChange]
  )

  // 完全自定义触发器
  const isCusTrigger = isValidElement(trigger)

  return (
    <Collapsible
      open={currentOpen}
      onOpenChange={handleOpenChange}
      className={cn('group/collapsible', className)}
      render={wrapper ?? <div />}
    >
      {isCusTrigger && <CollapsibleTrigger render={trigger} />}
      {!isCusTrigger && (
        <CollapsibleTrigger
          className={cn(
            'flex items-center gap-2 [&_svg:not([class*="size-"])]:size-4',
            triggerCls
          )}
        >
          <span>{title}</span>
          {arrow ?? (
            <ChevronRight
              className={cn(
                'ml-auto transition-transform duration-300 group-data-open/collapsible:rotate-90',
                arrowCls
              )}
            />
          )}
        </CollapsibleTrigger>
      )}

      <CollapsibleContent keepMounted={keepMounted}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export { Collapse }
export type { CollapseProps }
