import { useState, useCallback, isValidElement } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/Collapsible'

interface CollapseProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
  className?: string
  trigger?: React.ReactNode
  wrapper?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Collapse({
  title,
  children,
  defaultOpen = false,
  disabled = false,
  className,
  trigger,
  wrapper,
  open: controlledOpen,
  onOpenChange,
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

  const triggerElement: React.ReactElement = isValidElement(trigger) ? (
    (trigger as React.ReactElement)
  ) : (
    <span>{trigger ?? title}</span>
  )

  return (
    <Collapsible
      open={currentOpen}
      onOpenChange={handleOpenChange}
      className={className}
      render={wrapper ?? <div />}
    >
      <CollapsibleTrigger render={triggerElement} />
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

export { Collapse }
export type { CollapseProps }
