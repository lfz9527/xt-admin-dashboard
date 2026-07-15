import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useNavTab } from './context'
import { cn } from '@/utils/common'
import AutoEllipsis from '@/components/AutoEllipsis'

export function NavTab({ className, ...props }: React.ComponentProps<'div'>) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useNavTab()
  const containerRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  function updatePill() {
    const container = containerRef.current
    if (!container || !activeTabId) return
    const el = container.querySelector(
      `[data-tab-id="${activeTabId}"]`
    ) as HTMLElement | null
    if (!el) return
    setPillStyle({
      left: el.offsetLeft,
      width: el.offsetWidth,
    })
  }

  useEffect(() => {
    updatePill()
  }, [activeTabId, tabs])

  if (tabs.length === 0) return null

  return (
    <div
      ref={containerRef}
      data-slot='nav-tab'
      className={cn(
        'relative flex items-center gap-1.5 border-b px-2 py-1',
        className
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            data-slot='nav-tab-item'
            data-active={isActive ? 'true' : 'false'}
            className='group/nav-tab-item text-muted-foreground data-[active=true]:text-menu-accent-foreground hover:text-menu-accent-foreground hover:bg-menu-accent relative z-10 flex w-30 cursor-pointer items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors select-none data-[active=true]:font-medium'
            onClick={() => setActiveTab(tab.id)}
          >
            <AutoEllipsis
              text={tab.title}
              className='min-w-0 flex-1'
            />
            {tab.closable && (
              <span
                data-slot='nav-tab-close'
                className={cn(
                  'hover:bg-menu-accent inline-flex size-4 items-center justify-center rounded-sm transition-opacity',
                  isActive
                    ? 'opacity-100'
                    : 'opacity-0 group-hover/nav-tab-item:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
              >
                <X className='size-3' />
              </span>
            )}
          </div>
        )
      })}
      <div
        className='bg-menu-accent absolute top-1 bottom-1 z-0 rounded-sm transition-all duration-200'
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />
    </div>
  )
}
