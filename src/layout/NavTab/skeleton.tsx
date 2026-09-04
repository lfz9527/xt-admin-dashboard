import { Skeleton } from '@/ui/Skeleton'

// NavTab 懒加载占位：几个标签块加右侧功能按钮骨架
export function NavTabSkeleton() {
  return (
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
}
