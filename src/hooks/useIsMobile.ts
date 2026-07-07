import { useState, useRef, useLayoutEffect } from 'react'
import { MOBILE_BREAKPOINT } from '@/constants'
import { useEventListener } from './useEventListener'

/**
 * 判断是否为移动端
 * @returns
 */
export function useIsMobile() {
  const matchRef = useRef<MediaQueryList>(
    window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  )
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  function onChange() {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }

  useLayoutEffect(onChange, [])

  useEventListener('change', onChange, matchRef)

  return !!isMobile
}
