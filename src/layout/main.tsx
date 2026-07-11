import { Outlet } from 'react-router'
import Header from '@/components/Header'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col overflow-auto'>
      <Header />
      <div className='p-2'>
        <Outlet />
      </div>
    </div>
  )
}
