import { useLayoutEffect, useRef, useState } from 'react'

type Target = HTMLElement

type OriginalStyle = {
  overflow: CSSStyleDeclaration['overflow']
  paddingRight: CSSStyleDeclaration['paddingRight']
}

type UseScrollLockOptions = {
  autoLock?: boolean
  target?: Target
  widthReflow?: boolean
}

/**
 *
 * @param {Object} options - 配置对象
 * @param {boolean} options.lockState - 是否开启滚动锁定
 * @param {HTMLElement} [options.target=document.body] - 目标元素，默认锁定 body
 * @param {boolean} [options.widthReflow=false] - 是否处理滚动条导致的宽度回流（防止闪动）
 */
export const useScrollLock = ({
  autoLock,
  target,
  widthReflow = true,
}: UseScrollLockOptions) => {
  const targetRef = useRef<Target | null>(null)
  const originalStyle = useRef<OriginalStyle | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const lock = () => {
    const el = targetRef.current
    if (!el) return
    const { overflow, paddingRight } = el.style

    originalStyle.current = { overflow, paddingRight }

    // 解决宽度变化 重流问题
    if (widthReflow) {
      const offsetWidth =
        el === document.body ? window.innerWidth : el.offsetWidth

      // 以像素为单位获取当前计算填充
      const currentPaddingRight =
        parseInt(window.getComputedStyle(el).paddingRight, 10) || 0

      const scrollbarWidth = offsetWidth - el.scrollWidth
      el.style.paddingRight = `${scrollbarWidth + currentPaddingRight}px`
    }

    el.style.overflow = 'hidden'
    setIsLocked(true)
  }

  const unlock = () => {
    const el = targetRef.current
    if (el && originalStyle.current) {
      el.style.overflow = originalStyle.current.overflow

      // 仅改变padding right
      if (widthReflow) {
        el.style.paddingRight = originalStyle.current.paddingRight
      }
    }

    setIsLocked(false)
  }

  useLayoutEffect(() => {
    const targetEl = target ?? document.body
    targetRef.current = targetEl

    if (autoLock) {
      lock()
    }

    return () => {
      unlock()
    }
  }, [autoLock, target])

  return {
    isLocked,
    lock,
    unlock,
  }
}
