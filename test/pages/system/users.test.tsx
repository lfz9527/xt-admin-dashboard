import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ProgressProvider } from '@bprogress/react'
import { SidebarProvider } from '@/ui/Sidebar'
import useAuthor from '@/store/useAuthor'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({ matches: false }) as MediaQueryList
  }
})

beforeEach(() => {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
  }
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => []
  }
  useAuthor.setState({ token: 'test-token' })
})

import routes from '@/router/routes'
import { allowAllPermissions } from '@/router/menu'
import { buildRouter } from '@/router/utils'

afterEach(() => vi.restoreAllMocks())

describe('Users page', () => {
  it('点击查询用户详情按钮后跳转到随机用户详情', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)
    const router = createMemoryRouter(
      buildRouter(routes, allowAllPermissions),
      {
        initialEntries: ['/system/users'],
      }
    )

    render(
      <SidebarProvider>
        <ProgressProvider>
          <RouterProvider router={router} />
        </ProgressProvider>
      </SidebarProvider>
    )

    await userEvent.click(
      await screen.findByRole('button', { name: '查询用户详情' })
    )

    expect(router.state.location.pathname).toBe('/system/users/123456')
    expect(await screen.findByText(/user detail/)).toBeInTheDocument()
  })
})
