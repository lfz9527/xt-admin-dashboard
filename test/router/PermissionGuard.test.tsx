import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import PermissionGuard from '@/router/guards/PermissionGuard'
import useAuthor from '@/store/useAuthor'

const createTestRouter = () =>
  createMemoryRouter(
    [
      {
        element: <PermissionGuard />,
        children: [
          {
            path: '/',
            element: <div>有权限页面</div>,
            handle: { permission: 'admin' },
          },
        ],
      },
      { path: '/404', element: <div>404页面</div> },
    ],
    { initialEntries: ['/'] }
  )

describe('PermissionGuard', () => {
  beforeEach(() => {
    useAuthor.setState({ roleKey: null })
  })

  it('角色匹配时渲染子路由', () => {
    useAuthor.setState({ roleKey: 'admin' })
    render(<RouterProvider router={createTestRouter()} />)
    expect(screen.getByText('有权限页面')).toBeTruthy()
  })

  it('角色不匹配时重定向 404', () => {
    useAuthor.setState({ roleKey: 'user' })
    render(<RouterProvider router={createTestRouter()} />)
    expect(screen.getByText('404页面')).toBeTruthy()
  })
})
