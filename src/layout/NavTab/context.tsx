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
  /** 固定标签：不允许被关闭，始终排在最左（会话态，不持久化） */
  pinned?: boolean // 默认 false
}

export type NavTabContextProps = {
  tabs: Tab[]
  activeTabId: string | null
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  removeTabs: (ids: string[]) => void
  setActiveTab: (id: string) => void
  /** 每个标签的刷新计数，变化时内容区会重新挂载该标签对应的页面 */
  refreshCounts: Record<string, number>
  refreshTab: (id: string) => void
  /** 切换标签固定态：固定移至第一位；取消固定位置不变 */
  togglePin: (id: string) => void
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
  const [refreshCounts, setRefreshCounts] = useState<Record<string, number>>({})

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
      if (!target || !target.closable || target.pinned || prev.length === 1)
        return prev

      const index = prev.findIndex((t) => t.id === id)
      const remaining = prev.filter((t) => t.id !== id)

      // 关闭标签后同步清理其刷新计数，避免计数在会话内只增不减
      setRefreshCounts((prevCounts) => {
        const next = { ...prevCounts }
        delete next[id]
        return next
      })

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
      // 固定标签不允许被任何关闭操作移除（含批量关闭）
      const remaining = prev.filter((t) => !idSet.has(t.id) || t.pinned)
      // 允许全部关空（关闭全部标签页语义：空后由调用方打开默认菜单）
      // 实际被移除的标签：pinned 即使传入 id 也不删
      const removedIds = prev
        .filter((t) => idSet.has(t.id) && !t.pinned)
        .map((t) => t.id)

      // 关闭标签后同步清理其刷新计数，避免计数在会话内只增不减
      setRefreshCounts((prevCounts) => {
        const next = { ...prevCounts }
        removedIds.forEach((id) => {
          delete next[id]
        })
        return next
      })

      setActiveTabId((prevActive) => {
        if (prevActive && remaining.some((t) => t.id === prevActive))
          return prevActive
        // 激活标签被批量关闭时，激活其左侧最近的存活标签，无左侧则右侧最近的
        const activeIndex = prev.findIndex((t) => t.id === prevActive)
        for (let i = activeIndex - 1; i >= 0; i--) {
          if (remaining.some((t) => t.id === prev[i].id)) return prev[i].id
        }
        for (let i = activeIndex + 1; i < prev.length; i++) {
          if (remaining.some((t) => t.id === prev[i].id)) return prev[i].id
        }
        return remaining[0]?.id ?? null
      })

      return remaining
    })
  }, [])

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  const refreshTab = useCallback((id: string) => {
    setRefreshCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }, [])

  const togglePin = useCallback((id: string) => {
    setTabs((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target) return prev
      if (target.pinned) {
        // 取消固定：仅解除 pinned，位置保持不变
        return prev.map((t) => (t.id === id ? { ...t, pinned: false } : t))
      }
      // 固定：从原位置移除并移动到标签栏最左（第一位）
      return [{ ...target, pinned: true }, ...prev.filter((t) => t.id !== id)]
    })
  }, [])

  const contextValue = useMemo<NavTabContextProps>(
    () => ({
      tabs,
      activeTabId,
      addTab,
      removeTab,
      removeTabs,
      setActiveTab,
      refreshCounts,
      refreshTab,
      togglePin,
    }),
    [
      tabs,
      activeTabId,
      addTab,
      removeTab,
      removeTabs,
      setActiveTab,
      refreshCounts,
      refreshTab,
      togglePin,
    ]
  )

  return (
    <NavTabContext.Provider value={contextValue}>
      {children}
    </NavTabContext.Provider>
  )
}
