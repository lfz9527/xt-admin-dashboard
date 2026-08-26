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
  removeTabs: (ids: string[]) => void
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
      if (!target || !target.closable || prev.length === 1) return prev

      const index = prev.findIndex((t) => t.id === id)
      const remaining = prev.filter((t) => t.id !== id)

      setActiveTabId((prevActive) => {
        if (prevActive !== id) return prevActive
        if (remaining.length === 0) return null
        // 关闭激活标签后激活左侧相邻标签，关闭的是第一个标签时激活右侧相邻标签
        return remaining[Math.max(index - 1, 0)].id
      })

      return remaining
    })
  }, [])

  const removeTabs = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setTabs((prev) => {
      const idSet = new Set(ids)
      const remaining = prev.filter((t) => !idSet.has(t.id))
      // 至少保留一个标签页
      if (remaining.length === 0) return prev

      setActiveTabId((prevActive) => {
        if (prevActive && !idSet.has(prevActive)) return prevActive
        // 激活标签被批量关闭时，激活其左侧最近的存活标签，无左侧则右侧最近的
        const activeIndex = prev.findIndex((t) => t.id === prevActive)
        for (let i = activeIndex - 1; i >= 0; i--) {
          if (!idSet.has(prev[i].id)) return prev[i].id
        }
        for (let i = activeIndex + 1; i < prev.length; i++) {
          if (!idSet.has(prev[i].id)) return prev[i].id
        }
        return remaining[0].id
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
      removeTabs,
      setActiveTab,
    }),
    [tabs, activeTabId, addTab, removeTab, removeTabs, setActiveTab]
  )

  return (
    <NavTabContext.Provider value={contextValue}>
      {children}
    </NavTabContext.Provider>
  )
}
