import { Outlet } from 'react-router'
import Header from '@/components/Header'
import { NavTab } from './NavTab'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col overflow-auto'>
      <Header />

      <section className='h-9.5 w-full border-b transition-all'>
        <NavTab />
      </section>
      <div className='size-full p-(--main-content-padding)'>
        <Outlet />
      </div>
    </div>
  )
}
