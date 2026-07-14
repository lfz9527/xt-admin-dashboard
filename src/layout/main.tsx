import { Outlet } from 'react-router'
import Header from '@/components/Header'
import { NavTab } from './NavTab'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col overflow-auto'>
      <Header />
      <NavTab />
      <div className='size-full p-(--main-content-padding)'>
        <Outlet />
      </div>
    </div>
  )
}
