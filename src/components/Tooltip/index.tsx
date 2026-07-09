import type { ComponentProps, ReactNode } from 'react'

import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/Tooltip'

export type TooltipProps = Omit<
  ComponentProps<typeof TooltipRoot>,
  'children'
> & {
  children: ReactNode
  content: ReactNode
  contentProps?: ComponentProps<typeof TooltipContent>
  /** 悬浮多久后弹出，默认 600ms，传 0 立即弹出 */
  delay?: number
  /** 移开后多久关闭，默认 0 */
  closeDelay?: number
}

export { TooltipProvider }

export function Tooltip({
  children,
  content,
  contentProps,
  delay,
  closeDelay,
  ...props
}: TooltipProps) {
  return (
    <TooltipRoot {...props}>
      <TooltipTrigger
        delay={delay}
        closeDelay={closeDelay}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent {...contentProps}>{content}</TooltipContent>
    </TooltipRoot>
  )
}
