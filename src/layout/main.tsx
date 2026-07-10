import { Outlet } from 'react-router'
import Header from '@/components/Header'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col gap-4 overflow-auto'>
      <Header />
      <Outlet />
    </div>
  )
}
