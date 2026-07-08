import { useState, useCallback } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/Collapsible'

interface CollapseItem {
  key: string
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
  className?: string
  trigger?: React.ReactNode
}

interface CollapseProps {
  items: CollapseItem[]
  type?: 'multiple' | 'accordion'
  openKeys?: string[]
  defaultOpenKeys?: string[]
  onToggle?: (key: string, open: boolean) => void
}

function Collapse({
  items,
  type = 'multiple',
  openKeys,
  defaultOpenKeys,
  onToggle,
}: CollapseProps) {
  const isControlled = openKeys !== undefined

  const [internalOpenKeys, setInternalOpenKeys] = useState<string[]>(() => {
    if (isControlled) return []

    if (type === 'accordion') {
      // 手风琴模式：只保留最后一个 defaultOpen（含 defaultOpenKeys）项
      let key: string | undefined
      if (defaultOpenKeys?.length) {
        key = defaultOpenKeys[defaultOpenKeys.length - 1]
      }
      for (const item of items) {
        if (item.defaultOpen) key = item.key
      }
      return key ? [key] : []
    }

    const set = new Set(defaultOpenKeys ?? [])
    for (const item of items) {
      if (item.defaultOpen) set.add(item.key)
    }
    return [...set]
  })

  const currentOpenKeys = isControlled ? openKeys : internalOpenKeys

  const handleOpenChange = useCallback(
    (key: string, open: boolean) => {
      const item = items.find((i) => i.key === key)
      if (!item) return

      if (!open && item.disabled && item.defaultOpen) return
      if (open && item.disabled) return

      if (isControlled) {
        onToggle?.(key, open)
        return
      }

      setInternalOpenKeys((prev) => {
        if (open) {
          return type === 'accordion' ? [key] : [...prev, key]
        }
        return prev.filter((k) => k !== key)
      })
    },
    [items, isControlled, onToggle, type]
  )

  return (
    <>
      {items.map((item) => (
        <Collapsible
          key={item.key}
          open={currentOpenKeys.includes(item.key)}
          onOpenChange={(open) => handleOpenChange(item.key, open)}
          className={item.className}
        >
          <CollapsibleTrigger>{item.trigger ?? item.title}</CollapsibleTrigger>
          <CollapsibleContent>{item.children}</CollapsibleContent>
        </Collapsible>
      ))}
    </>
  )
}

export { Collapse }
export type { CollapseItem, CollapseProps }
