import { Outlet } from 'react-router'
import Header from '@/components/Header'
import { NavTab } from './NavTab'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <Header />

      <section className='h-9.5 w-full border-b transition-all'>
        <NavTab />
      </section>
      {/* 内容区为唯一滚动区域 */}
      <div className='min-h-0 flex-1 overflow-auto p-(--main-content-padding)'>
        <Outlet />
      </div>
    </div>
  )
}
