import { Skeleton } from '@/ui/Skeleton'

// Header 懒加载占位：按真实结构出骨架（侧栏开关、面包屑、功能按钮、用户信息），
// 容器与真实 Header 同高，加载期间布局不跳动
export function HeaderSkeleton() {
  return (
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
}
