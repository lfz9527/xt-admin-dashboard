import { Outlet } from 'react-router'

export default function Main() {
  return (
    <div className='flex flex-1 flex-col gap-4 overflow-auto p-2'>
      <Outlet />
    </div>
  )
}
