import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface Tab {
  id: string
  title: string
  closable?: boolean // 默认 true
}

export type NavTabContextProps = {
  tabs: Tab[]
  activeTabId: string | null
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
}

const NavTabContext = createContext<NavTabContextProps | null>(null)

export function useNavTab() {
  const context = useContext(NavTabContext)
  if (!context) {
    throw new Error('useNavTab must be used within a NavTabProvider.')
  }

  return context
}

export function NavTabProvider({
  children,
  defaultTabs = [],
  defaultActiveTabId = null,
}: {
  children: ReactNode
  defaultTabs?: Tab[]
  defaultActiveTabId?: string | null
}) {
  const [tabs, setTabs] = useState<Tab[]>(
    defaultTabs.map((t) => ({ ...t, closable: t.closable ?? true }))
  )
  const [activeTabId, setActiveTabId] = useState<string | null>(
    defaultActiveTabId
  )

  console.log('tabs===', tabs)

  const addTab = useCallback((tab: Tab) => {
    setTabs((prev) => {
      if (prev.some((t) => t.id === tab.id)) return prev
      return [...prev, { ...tab, closable: tab.closable ?? true }]
    })
    // React 批处理：setTabs 和 setActiveTabId 合并为一次渲染
    setActiveTabId(tab.id)
  }, [])

  const removeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target || !target.closable) return prev

      const remaining = prev.filter((t) => t.id !== id)

      setActiveTabId((prevActive) => {
        if (prevActive !== id) return prevActive
        if (remaining.length === 0) return null
        // 激活前一个标签页
        const idx = prev.findIndex((t) => t.id === id)
        const nextIdx = Math.max(0, idx - 1)
        return remaining[Math.min(nextIdx, remaining.length - 1)].id
      })

      return remaining
    })
  }, [])

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  const contextValue = useMemo<NavTabContextProps>(
    () => ({
      tabs,
      activeTabId,
      addTab,
      removeTab,
      setActiveTab,
    }),
    [tabs, activeTabId, addTab, removeTab, setActiveTab]
  )

  return (
    <NavTabContext.Provider value={contextValue}>
      {children}
    </NavTabContext.Provider>
  )
}
