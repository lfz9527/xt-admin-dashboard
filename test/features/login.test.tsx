import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import LoginFeature from '@/features/login'
import useAuthor from '@/store/useAuthor'

const navigate = vi.fn()

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

describe('LoginFeature', () => {
  beforeEach(() => {
    navigate.mockReset()
    useAuthor.setState({ token: '' })
  })

  it('shows validation messages for empty fields', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    expect(screen.getByText('登录管理后台')).toBeInTheDocument()
    expect(screen.getByText('欢迎你的到来，请使用账号登录')).toBeInTheDocument()
    expect(screen.getByLabelText('账号')).toHaveAttribute(
      'placeholder',
      '请输入账号'
    )
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'placeholder',
      '请输入密码'
    )

    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(2)
    expect(screen.getByLabelText('账号')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
  })

  it('stores a mock token and navigates home after submit', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('账号'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.click(screen.getByRole('checkbox', { name: '记住账号密码' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled()
    await new Promise((resolve) => setTimeout(resolve, 1300))
    expect(useAuthor.getState().token).toMatch(/^mock-token-/)
    expect(navigate).toHaveBeenCalledWith('/')
    expect(sessionStorage.getItem('login-credentials')).toBe(
      JSON.stringify({ account: 'admin', password: 'password' })
    )
  })
})
