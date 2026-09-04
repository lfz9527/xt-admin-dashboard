import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import BaseLayout from '@/layout/baseLayout'
import useMenu from '@/store/useMenu'

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid='app-header'>header</div>,
}))
vi.mock('@/features/auth/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/hooks')>()),
  useUserInfo: () => undefined,
}))

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
  useMenu.setState({ maximized: false, sidebarOpen: true })
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
})

function renderLayout() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <BaseLayout />,
        children: [
          { index: true, element: <div data-testid='page-content'>page</div> },
        ],
      },
    ],
    { initialEntries: ['/'] }
  )
  render(<RouterProvider router={router} />)
}

describe('最大化（布局级）', () => {
  it('最大化后 wrapper 携带 data-maximized 且 Header 隐藏，还原后恢复', async () => {
    renderLayout()

    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]')!
    // 等待 NavTabSync 将当前路由同步为标签，功能区按钮随之出现
    await waitFor(() => {
      expect(wrapper.querySelector('[data-slot="nav-tab-item"]')).not.toBeNull()
    })

    expect(wrapper.getAttribute('data-maximized')).toBeNull()
    expect(screen.getByTestId('app-header')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '最大化' }))
    expect(useMenu.getState().maximized).toBe(true)
    expect(wrapper.getAttribute('data-maximized')).toBe('true')
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument()
    // 最大化聚焦内容：页面内容仍在，刷新/最大化功能区常驻
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '还原' }))
    expect(useMenu.getState().maximized).toBe(false)
    expect(wrapper.getAttribute('data-maximized')).toBeNull()
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
  })
})
