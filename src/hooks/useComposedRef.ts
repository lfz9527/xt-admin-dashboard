import { useCallback } from 'react'
import { useLatest } from './useLatest'

type RefCallback<T> = (node: T | null) => void
type Ref<T> = RefCallback<T> | React.RefObject<T> | null | undefined

function setRef<T>(ref: Ref<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref != null) {
    const objRef = ref as React.RefObject<T | null>
    objRef.current = value
  }
}

/**
 * 将多个 ref 合并为一个稳定的 callback ref。
 *
 * @example
 * const Input = forwardRef<HTMLInputElement>((props, outerRef) => {
 *   const innerRef = useRef<HTMLInputElement>(null)
 *   const composedRef = useComposedRef(innerRef, outerRef)
 *   return <input ref={composedRef} {...props} />
 * })
 *
 * @param refs 任意数量的 ref，支持 object ref、callback ref、null、undefined 混用
 * @returns 一个稳定的 callback ref（引用不随渲染变化），挂载/卸载时同步更新所有传入的 ref
 */
export function useComposedRef<T>(...refs: Ref<T>[]): RefCallback<T> {
  const storedRefs = useLatest(refs)

  return useCallback(
    (node: T | null) => {
      for (const ref of storedRefs.current) {
        setRef(ref, node)
      }
    },
    [refs]
  )
}
