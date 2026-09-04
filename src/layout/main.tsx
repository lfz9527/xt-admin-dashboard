import { Outlet } from 'react-router'
import Header from '@/components/Header'
import { useMenu } from '@/store'
import { NavTab, useNavTab } from './NavTab'

export default function Main() {
  const { activeTabId, refreshCounts } = useNavTab()
  const maximized = useMenu((s) => s.maximized)
  // key 随当前标签的刷新计数变化，计数改变即重挂载内容，实现标签页「刷新」。
  // key 不含路径，切换标签与同路由参数变化保持既有重挂载语义；已知边界：在计数
  // 不同的标签间切换会重挂载内容区（对共享同一路由元素的参数页表现为整页重挂载
  // 而非参数更新，属可接受且数据更干净的行为）
  const refreshKey = activeTabId ? (refreshCounts[activeTabId] ?? 0) : 0

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* 最大化时隐藏顶部栏（头像/面包屑所在行），聚焦内容 */}
      {!maximized && <Header />}

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
