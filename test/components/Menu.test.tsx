import { describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

import routes from '@/router/routes'
import { routeToMenus } from '@/router/menu'
import useMenu from '@/store/useMenu'

describe('Menus', () => {
  it('derives dashboard and system menu hierarchy from routes', () => {
    const menus = routeToMenus(routes)

    const keys = menus.flatMap((item) => [
      item.key,
      ...(item.children?.flatMap((child) => [
        child.key,
        ...(child.children?.map(({ key }) => key) ?? []),
      ]) ?? []),
    ])

    expect(keys).toEqual([
      'home',
      'dashboard',
      'dashboard-overview',
      'dashboard-analytics',
      'system',
    ])
    expect(menus.some(({ key }) => key.includes('detail'))).toBe(false)
    expect(
      menus
        .flatMap((item) => item.children ?? [])
        .some(({ key }) => key.includes('detail'))
    ).toBe(false)
  })

  it('keeps only sidebar state in the menu store', () => {
    const state = useMenu.getState()

    expect(state).not.toHaveProperty('menus')
    expect(localStorage.getItem('app-menu')).toBeNull()
  })
})
