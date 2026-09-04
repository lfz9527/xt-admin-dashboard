import { useEffect, useRef, useState } from 'react'
import { ChevronsUp, Maximize2, Minimize2, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useMenu } from '@/store'
import { useNavTab } from './context'
import { cn } from '@/utils/common'
import AutoEllipsis from '@/components/AutoEllipsis'
import { Button } from '@/ui/Button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/ui/ContextMenu'
import { ScrollArea } from '@/ui/ScrollArea'
import { Separator } from '@/ui/Separator'

export function NavTab({ className, ...props }: React.ComponentProps<'div'>) {
  const { tabs, activeTabId, removeTab, removeTabs, refreshTab } = useNavTab()
  const maximized = useMenu((s) => s.maximized)
  const toggleMaximize = useMenu((s) => s.toggleMaximize)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<string, HTMLDivElement>())
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const [scrollState, setScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })
  const updateScrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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

  function updateScrollState() {
    const viewport = viewportRef.current
    if (!viewport) return
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
    setScrollState({
      hasOverflow: maxScrollLeft > 0,
      canScrollLeft: viewport.scrollLeft > 0,
      canScrollRight: viewport.scrollLeft < maxScrollLeft,
    })
  }

  function scrollTabs(direction: -1 | 1) {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      left: direction * viewport.clientWidth,
      behavior: 'smooth',
    })
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const viewport = viewportRef.current
    if (!viewport) return
    // 无溢出时不拦截，滚轮保留页面默认垂直滚动
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
    if (maxScrollLeft <= 0) return
    e.preventDefault()
    viewport.scrollLeft += e.deltaX - e.deltaY
  }

  useEffect(() => {
    updatePill()
    const tab = activeTabId && tabRefs.current.get(activeTabId)
    if (tab && typeof tab.scrollIntoView === 'function') {
      tab.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    }
    // 等待关闭动画结束后再测量，避免读到收缩前的 scrollWidth
    updateScrollTimerRef.current = setTimeout(() => updateScrollState(), 100)

    const viewport = viewportRef.current
    const container = containerRef.current
    if (!viewport || !container) return

    viewport.addEventListener('scroll', updateScrollState)
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScrollState)
        : null
    resizeObserver?.observe(viewport)
    resizeObserver?.observe(container)

    return () => {
      clearTimeout(updateScrollTimerRef.current)
      viewport.removeEventListener('scroll', updateScrollState)
      resizeObserver?.disconnect()
    }
  }, [activeTabId, tabs])

  if (tabs.length === 0) return null

  // 关闭激活标签后，优先跳转左侧相邻标签，无左侧时跳转右侧相邻标签
  function getNextActive(closedIds: string[]): string | undefined {
    const idSet = new Set(closedIds)
    const index = tabs.findIndex((t) => t.id === activeTabId)
    for (let i = index - 1; i >= 0; i--) {
      if (!idSet.has(tabs[i].id)) return tabs[i].id
    }
    for (let i = index + 1; i < tabs.length; i++) {
      if (!idSet.has(tabs[i].id)) return tabs[i].id
    }
    return undefined
  }

  function handleClose(id: string) {
    removeTab(id)
    if (id === activeTabId) {
      const next = getNextActive([id])
      if (next) navigate(next)
    }
  }

  function closeBatch(ids: string[]) {
    const idSet = new Set(ids)
    removeTabs(ids)
    if (activeTabId && idSet.has(activeTabId)) {
      const next = getNextActive(ids)
      if (next) navigate(next)
    }
  }

  function handleCloseLeft(id: string) {
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx <= 0) return
    closeBatch(tabs.slice(0, idx).map((t) => t.id))
  }

  function handleCloseRight(id: string) {
    const idx = tabs.findIndex((t) => t.id === id)
    if (idx < 0 || idx === tabs.length - 1) return
    closeBatch(tabs.slice(idx + 1).map((t) => t.id))
  }

  function handleCloseAll() {
    if (!activeTabId) return
    closeBatch(tabs.map((t) => t.id).filter((id) => id !== activeTabId))
  }

  function handleRefresh(id: string) {
    if (id === activeTabId) {
      // 激活标签内容已挂载，通过计数变化强制重挂载实现刷新
      refreshTab(id)
      return
    }
    // 非激活标签内容尚未挂载，跳转后即为全新挂载，无需再计数重挂载
    navigate(id)
  }

  return (
    <div
      data-slot='nav-tab'
      className='size-full flex-1 overflow-hidden'
      onWheel={handleWheel}
      {...props}
    >
      <div className='flex size-full min-w-0'>
        {scrollState.hasOverflow && (
          <Button
            aria-label='向左滚动'
            className='h-full w-7 shrink-0 rounded-none shadow-sm'
            disabled={!scrollState.canScrollLeft}
            onClick={() => scrollTabs(-1)}
            size='icon-xs'
            variant='ghost'
          >
            <ChevronsUp className='size-4 -rotate-90' />
          </Button>
        )}
        <ScrollArea
          scrollbar='horizontal'
          className='min-w-0 flex-1 px-2 pt-0.75'
          viewportRef={viewportRef}
        >
          <div
            ref={containerRef}
            className='relative flex h-full w-max min-w-full gap-1'
          >
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTabId
              const isFirst = index === 0
              const isLast = index === tabs.length - 1

              return (
                <ContextMenu key={tab.id}>
                  <ContextMenuTrigger
                    render={
                      <div
                        ref={(element) => {
                          if (element) tabRefs.current.set(tab.id, element)
                          else tabRefs.current.delete(tab.id)
                        }}
                        data-tab-id={tab.id}
                        data-slot='nav-tab-item'
                        data-active={isActive ? 'true' : 'false'}
                        className={cn(
                          'group',
                          'relative z-1 mb-0.75 flex w-30 shrink-0 cursor-pointer items-center gap-2 px-2 text-sm',
                          'hover:bg-sidebar-accent data-[active=true]:hover:bg-transparent',
                          'data-[active=false]:rounded-sm',
                          'data-[active=true]:text-menu-accent-foreground'
                        )}
                        onClick={() => navigate(tab.id)}
                      />
                    }
                  >
                    <AutoEllipsis
                      text={tab.title}
                      className='min-w-0 flex-1 select-none'
                    />
                    {tab.closable && tabs.length > 1 && (
                      <span
                        data-slot='nav-tab-close'
                        className={cn(
                          'flex-center size-4 rounded',
                          'group-data-[active=true]:hover:bg-menu-accent'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose(tab.id)
                        }}
                      >
                        <X className='size-3' />
                      </span>
                    )}
                    {!isActive && (
                      <Separator
                        orientation='vertical'
                        className='absolute top-1/2 -right-0.5 h-5 -translate-y-1/2'
                      />
                    )}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleRefresh(tab.id)}>
                      刷新
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={tabs.length <= 1 || !tab.closable}
                      onClick={() => handleClose(tab.id)}
                    >
                      关闭
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={isFirst}
                      onClick={() => handleCloseLeft(tab.id)}
                    >
                      关闭左侧标签页
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={isLast}
                      onClick={() => handleCloseRight(tab.id)}
                    >
                      关闭右侧标签页
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      disabled={tabs.length <= 1}
                      onClick={handleCloseAll}
                    >
                      关闭全部标签页
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
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
        </ScrollArea>
        {scrollState.hasOverflow && (
          <Button
            aria-label='向右滚动'
            className='h-full w-7 shrink-0 rounded-none shadow-sm'
            disabled={!scrollState.canScrollRight}
            onClick={() => scrollTabs(1)}
            size='icon-xs'
            variant='ghost'
          >
            <ChevronsUp className='size-4 rotate-90' />
          </Button>
        )}
        {/* 标签栏右侧功能区：当前提供刷新与最大化当前激活标签页的能力 */}
        <div
          data-slot='nav-tab-actions'
          className='flex h-full shrink-0 items-center gap-1 border-l px-1.5'
        >
          <Button
            aria-label='刷新'
            className='rounded-sm'
            disabled={!activeTabId}
            onClick={() => activeTabId && handleRefresh(activeTabId)}
            size='icon-sm'
            variant='ghost'
          >
            <RefreshCw className='size-4' />
          </Button>
          <Separator orientation='vertical' />
          <Button
            aria-label={maximized ? '还原' : '最大化'}
            title={maximized ? '还原' : '最大化'}
            className='rounded-sm'
            onClick={toggleMaximize}
            size='icon-sm'
            variant='ghost'
          >
            {maximized ? (
              <Minimize2 className='size-4' />
            ) : (
              <Maximize2 className='size-4' />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
