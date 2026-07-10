import { useRef, useEffect } from 'react'

import { cn } from '@/utils/common'

export type AutoTooltipProps = Global.ElAttrs<HTMLDivElement> & {
  text: string | number
  lines?: number
}
export default function Index({
  text,
  className,
  style,
  lines = 1,
  ...props
}: AutoTooltipProps) {
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = divRef.current
    if (!el) return

    const checkOverflow = () => {
      let isOverflow = false
      if (lines < 2) {
        // 单行：检测水平溢出
        isOverflow = el.scrollWidth > el.clientWidth
      } else {
        // 多行：检测垂直溢出
        isOverflow = el.scrollHeight > el.clientHeight
      }
      el.setAttribute('title', isOverflow ? text.toString() : '')
    }
    const ro = new ResizeObserver(() => checkOverflow())
    ro.observe(el)

    return () => ro.disconnect()
  }, [text, lines])

  return (
    <div
      ref={divRef}
      className={cn(
        lines < 2 ? 'truncate' : 'line-clamp-(--lines) wrap-break-word',
        className
      )}
      style={{
        ['--lines' as string]: lines,
        ...style,
      }}
      {...props}
    >
      {text}
    </div>
  )
}
