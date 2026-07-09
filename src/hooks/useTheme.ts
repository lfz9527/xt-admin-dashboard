import { useEffect } from 'react'
import { useSetting } from '@/store'

type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = useSetting((s) => s.theme)
  const setTheme = useSetting((s) => s.setTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme } as const
}

export type { Theme }
