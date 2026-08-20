import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { EncryptionManager } from '@/utils/EncryptionManager'
import LoginFeature from '@/features/login'
import useAuthor from '@/store/useAuthor'

const navigate = vi.fn()
const encryptionManager = new EncryptionManager('xt-admin-dashboard-login-key')

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

describe('LoginFeature', () => {
  beforeEach(() => {
    navigate.mockReset()
    sessionStorage.clear()
    useAuthor.setState({
      token: '',
      account: '',
      encryptedPassword: '',
      remember: false,
    })
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

  it('stores encrypted credentials after submit', async () => {
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
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'), {
      timeout: 2000,
    })
    expect(useAuthor.getState().token).toMatch(/^mock-token-/)

    const stored = JSON.parse(
      sessionStorage.getItem('app-author') ?? '{}'
    ).state
    expect(stored.password).toBeUndefined()
    expect(stored.encryptedPassword).not.toContain('password')
    await expect(
      encryptionManager.decrypt(stored.encryptedPassword)
    ).resolves.toBe('password')
  })

  it('fills saved credentials on load', async () => {
    const encryptedPassword = await encryptionManager.encrypt('password')
    useAuthor.setState({
      account: 'admin',
      encryptedPassword,
      remember: true,
    })

    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('账号')).toHaveValue('admin')
      expect(screen.getByLabelText('密码')).toHaveValue('password')
    })
    expect(screen.getByRole('checkbox', { name: '记住账号密码' })).toBeChecked()
  })

  it('clears saved credentials when remember is disabled', async () => {
    const user = userEvent.setup()
    const encryptedPassword = await encryptionManager.encrypt('password')
    useAuthor.setState({
      account: 'admin',
      encryptedPassword,
      remember: true,
    })

    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByLabelText('账号')).toHaveValue('admin')
    )
    await user.click(screen.getByRole('checkbox', { name: '记住账号密码' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'), {
      timeout: 2000,
    })
    expect(useAuthor.getState()).toMatchObject({
      account: '',
      encryptedPassword: '',
      remember: false,
    })
  })
})
