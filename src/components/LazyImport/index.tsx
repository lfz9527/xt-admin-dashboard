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
      style={{
        width: '100%',
        height: '100%',
      }}
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
