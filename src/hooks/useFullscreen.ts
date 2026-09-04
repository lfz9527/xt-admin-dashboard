import { useRef, useState } from 'react'
import { useEventListener } from './useEventListener'

/**
 * 浏览器全屏状态与切换。
 * 状态以 document.fullscreenElement 与 fullscreenchange 事件为准，
 * 天然覆盖 ESC 退出等浏览器级全屏切换。
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => !!document.fullscreenElement
  )
  const documentRef = useRef(document)

  useEventListener(
    'fullscreenchange',
    () => {
      setIsFullscreen(!!document.fullscreenElement)
    },
    documentRef
  )

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {})
    }
  }

  return { isFullscreen, toggleFullscreen }
}
