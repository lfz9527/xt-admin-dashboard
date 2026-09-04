import { Outlet } from 'react-router'
import { useMenu } from '@/store'
import { Lazy } from '@/components/LazyImport'
import { Skeleton } from '@/ui/Skeleton'
import { useNavTab } from './NavTab'

// Header 懒加载占位：按真实结构出骨架（侧栏开关、面包屑、功能按钮、用户信息），
// 容器与真实 Header 同高，加载期间布局不跳动
const headerFallback = (
  <header className='flex h-(--header-height) shrink-0 items-center border-b'>
    <div className='flex w-full items-center justify-between gap-2 px-2'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-7 rounded-md' />
        <Skeleton className='h-4 w-32 rounded-sm' />
      </div>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-7 rounded-md' />
        <Skeleton className='size-7 rounded-md' />
        <Skeleton className='h-9 w-24 rounded-full' />
      </div>
    </div>
  </header>
)

// NavTab 懒加载占位：几个标签块加右侧功能按钮骨架
const navTabFallback = (
  <div className='flex size-full items-center gap-1 px-2 pt-0.75'>
    <Skeleton className='h-8 w-30 rounded-sm' />
    <Skeleton className='h-8 w-24 rounded-sm' />
    <Skeleton className='h-8 w-28 rounded-sm' />
    <div className='ml-auto flex h-full items-center gap-1 border-l px-1.5'>
      <Skeleton className='size-7 rounded-md' />
      <Skeleton className='h-4 w-px' />
      <Skeleton className='size-7 rounded-md' />
    </div>
  </div>
)

const Header = Lazy(() => import('@/components/Header'), headerFallback)
// NavTab 懒加载（模块为具名导出，经 .then 映射为默认导出以适配 React.lazy）
const NavTab = Lazy(
  () => import('./NavTab').then((m) => ({ default: m.NavTab })),
  navTabFallback
)

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
      {!maximized && Header}

      <section className='h-9.5 w-full border-b transition-all'>
        {NavTab}
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
