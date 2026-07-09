import { useEffect } from 'react'
import { useSetting } from '@/store'
import { type Theme } from '@/types/setting'

function updateDocumentTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getTransitionRadius(x: number, y: number) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )
}

function setTransitionVars(x: number, y: number) {
  const root = document.documentElement
  root.style.setProperty('--theme-transition-x', `${x}px`)
  root.style.setProperty('--theme-transition-y', `${y}px`)
  root.style.setProperty(
    '--theme-transition-radius',
    `${getTransitionRadius(x, y)}px`
  )
}

function setTransitionClass(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('theme-transition-expand', 'theme-transition-shrink')
  root.classList.add(
    theme === 'dark' ? 'theme-transition-expand' : 'theme-transition-shrink'
  )
}

function clearTransitionClass() {
  document.documentElement.classList.remove(
    'theme-transition-expand',
    'theme-transition-shrink'
  )
}

function hasViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

export function useTheme() {
  const theme = useSetting((s) => s.theme)
  const setTheme = useSetting((s) => s.setTheme)

  useEffect(() => {
    updateDocumentTheme(theme)
  }, [theme])

  const toggleTheme = (event?: { clientX: number; clientY: number }) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    if (!hasViewTransition() || !event) {
      setTheme(nextTheme)
      return
    }

    setTransitionVars(event.clientX, event.clientY)
    setTransitionClass(nextTheme)

    const transition = document.startViewTransition(() => {
      updateDocumentTheme(nextTheme)
      setTheme(nextTheme)
    })

    transition.finished.finally(clearTransitionClass)
  }

  return { theme, setTheme, toggleTheme } as const
}

export type { Theme }
