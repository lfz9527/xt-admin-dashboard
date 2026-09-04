import { Suspense, type ComponentType, type ReactNode, lazy } from 'react'
import Loading from '@/components/Loading'

type Module = Promise<{ default: ComponentType<any> }>

type LazyImportProps = {
  children: ReactNode
  fallback?: ReactNode
}

function LazyImport({
  children,
  fallback = (
    <Loading
      size={30}
      className='h-100 w-full'
    />
  ),
}: LazyImportProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

export default LazyImport

// fallback 不传时沿用 LazyImport 默认占位（整页加载场景）；小块区域可自行传入小占位，
// 避免默认的高占位把布局撑高
export function Lazy(factory: () => Module, fallback?: ReactNode) {
  const Component = lazy(factory)
  return (
    <LazyImport fallback={fallback}>
      <Component />
    </LazyImport>
  )
}
