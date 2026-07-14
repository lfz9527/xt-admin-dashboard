import { X } from 'lucide-react'
import { useNavTab } from './context'
import { cn } from '@/utils/common'

export function NavTab({ className, ...props }: React.ComponentProps<'div'>) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useNavTab()

  if (tabs.length === 0) return null

  return (
    <div
      data-slot='nav-tab'
      className={cn('flex items-center gap-0 border-b', className)}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            data-slot='nav-tab-item'
            data-active={isActive ? 'true' : 'false'}
            className={cn(
              'group/nav-tab-item relative flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors select-none',
              isActive
                ? 'border-primary text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className='max-w-40 truncate'>{tab.title}</span>
            {tab.closable && (
              <span
                data-slot='nav-tab-close'
                className={cn(
                  'hover:bg-muted-foreground/20 inline-flex size-4 items-center justify-center rounded-sm transition-opacity',
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
    </div>
  )
}
