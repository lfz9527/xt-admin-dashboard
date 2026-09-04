import { Outlet } from 'react-router'
import Header from '@/components/Header'
import { NavTab, useNavTab } from './NavTab'

export default function Main() {
  const { activeTabId, refreshCounts } = useNavTab()
  // key 随当前标签的刷新计数变化，计数改变即重挂载内容，实现标签页「刷新」
  const refreshKey = activeTabId ? (refreshCounts[activeTabId] ?? 0) : 0

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <Header />

      <section className='h-9.5 w-full border-b transition-all'>
        <NavTab />
      </section>
      {/* 内容区为唯一滚动区域 */}
      <div className='m-(--main-content-padding) min-h-0 flex-1 overflow-auto px-(--main-content-padding)'>
        {/* 上下留白放在滚动内容内层：容器自身的 pb 不参与滚动溢出，放容器上底部间隙会被吞掉 */}
        <div className='h-full py-(--main-content-padding)'>
          <Outlet key={refreshKey} />
        </div>
      </div>
    </div>
  )
}
