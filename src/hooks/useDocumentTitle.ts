import { useLayoutEffect, useRef } from 'react'
import { useUnmount } from './useUnmount'

type UseDocumentTitleOptions = {
  /**
   * 卸载组件后是否保留标题（默认是）
   */
  preserveTitleOnUnmount?: boolean
}

export function useDocumentTitle(
  title: string,
  options?: UseDocumentTitleOptions
) {
  const { preserveTitleOnUnmount = true } = options || {}

  const defaultTitle = useRef<string | null>(null)

  useLayoutEffect(() => {
    defaultTitle.current = window.document.title
  }, [])

  useLayoutEffect(() => {
    window.document.title = title
  }, [title])

  useUnmount(() => {
    if (!preserveTitleOnUnmount && defaultTitle.current) {
      window.document.title = defaultTitle.current
    }
  })
}
