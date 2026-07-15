import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useNavTab } from './context'
import { cn } from '@/utils/common'
import AutoEllipsis from '@/components/AutoEllipsis'
import { Button } from '@/ui/Button'

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
      className='size-full flex-1 overflow-hidden px-2 pt-0.75'
      {...props}
    >
      <div className='relative flex h-full'>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              data-slot='nav-tab-item'
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                'group',
                'z-1 mb-0.75 flex w-30 cursor-pointer items-center gap-2 px-2 text-sm',
                'hover:bg-sidebar-accent data-[active=true]:hover:bg-transparent',
                'data-[active=false]:rounded-sm',
                'data-[active=true]:text-menu-accent-foreground'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <AutoEllipsis
                text={tab.title}
                className='min-w-0 flex-1 select-none'
              />
              {tab.closable && (
                <span
                  data-slot='nav-tab-close'
                  className={cn(
                    'flex-center size-4 rounded',
                    'group-data-[active=true]:hover:bg-menu-accent'
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
          className='absolute top-0 bottom-0 z-0 px-1 transition-all duration-200'
          style={
            {
              left: pillStyle.left,
              width: pillStyle.width,
              '--svg-size': 7,
            } as React.CSSProperties
          }
        >
          <div className='bg-menu-accent size-full rounded-tl-sm rounded-tr-sm' />
          <svg
            className='fill-menu-accent absolute bottom-0 -left-0.75 transition-all duration-150'
            height='var(--svg-size)'
            width='var(--svg-size)'
          >
            <path d='M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z'></path>
          </svg>
          <svg
            className='fill-menu-accent absolute -right-0.75 bottom-0 transition-all duration-150'
            height='var(--svg-size)'
            width='var(--svg-size)'
          >
            <path d='M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z'></path>
          </svg>
        </div>
      </div>
    </div>
  )
}
