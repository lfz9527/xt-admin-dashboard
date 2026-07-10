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
      className='size-full'
    />
  ),
}: LazyImportProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

export default LazyImport

export function Lazy(factory: () => Module) {
  const Component = lazy(factory)
  return (
    <LazyImport>
      <Component />
    </LazyImport>
  )
}
