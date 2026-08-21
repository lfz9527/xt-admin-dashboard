import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { EncryptionManager } from '@/utils/EncryptionManager'
import LoginFeature from '@/pages/login'
import useAuthor from '@/store/useAuthor'

const navigate = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const encryptionManager = new EncryptionManager('xt-admin-dashboard-login-key')

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess },
}))

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

/** 从 SVG 中读取当前图形验证码文本 */
function getCaptchaCode() {
  return Array.from(document.querySelectorAll('[data-slot="captcha-text"]'))
    .map((el) => el.textContent)
    .join('')
}

describe('LoginFeature', () => {
  beforeEach(() => {
    navigate.mockReset()
    toastSuccess.mockReset()
    sessionStorage.clear()
    useAuthor.setState({
      token: '',
      account: '',
      encryptedPassword: '',
      remember: false,
    })
  })

  it('switches to registration without navigating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '注册账号' }))

    expect(screen.getByText('注册管理后台')).toBeInTheDocument()
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '返回登录' })).toBeInTheDocument()
  })

  it('switches to password recovery without navigating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '忘记密码' }))

    expect(screen.getByText('忘记密码')).toBeInTheDocument()
    expect(screen.getByLabelText(/新密码/)).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
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

    expect(await screen.findAllByRole('alert')).toHaveLength(3)
    expect(screen.getByLabelText('账号')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
  })

  it('validates registration fields and matching passwords', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '注册账号' }))
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(5)

    await user.type(screen.getByLabelText(/邮箱/), 'invalid')
    await user.type(screen.getByPlaceholderText('请输入密码'), 'password')
    await user.type(screen.getByLabelText(/确认密码/), 'different')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByText('请输入有效的邮箱')).toBeInTheDocument()
    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
  })

  it('validates password recovery fields and matching passwords', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '忘记密码' }))
    await user.click(screen.getByRole('button', { name: '重置密码' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(4)

    await user.type(screen.getByLabelText(/邮箱/), 'invalid')
    await user.type(screen.getByLabelText(/新密码/), 'password')
    await user.type(screen.getByLabelText(/确认密码/), 'different')
    await user.click(screen.getByRole('button', { name: '重置密码' }))

    expect(await screen.findByText('请输入有效的邮箱')).toBeInTheDocument()
    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
  })

  it('completes registration and returns to login mode without navigating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '注册账号' }))
    await user.type(screen.getByLabelText(/邮箱/), 'admin@example.com')
    await user.type(screen.getByLabelText(/用户名/), 'admin')
    await user.type(screen.getByLabelText(/验证码/), '1234')
    await user.type(screen.getByPlaceholderText('请输入密码'), 'password')
    await user.type(screen.getByLabelText(/确认密码/), 'password')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(screen.getByRole('button', { name: /注册中/ })).toBeDisabled()
    await waitFor(
      () => expect(screen.getByText('登录管理后台')).toBeInTheDocument(),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('注册成功，请登录')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('completes password recovery and returns to login mode without navigating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '忘记密码' }))
    await user.type(screen.getByLabelText(/邮箱/), 'admin@example.com')
    await user.type(screen.getByLabelText(/验证码/), '1234')
    await user.type(screen.getByLabelText(/新密码/), 'password')
    await user.type(screen.getByLabelText(/确认密码/), 'password')
    await user.click(screen.getByRole('button', { name: '重置密码' }))

    expect(screen.getByRole('button', { name: /重置中/ })).toBeDisabled()
    await waitFor(
      () => expect(screen.getByText('登录管理后台')).toBeInTheDocument(),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('密码重置成功，请登录')
    expect(navigate).not.toHaveBeenCalled()
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
    await user.type(screen.getByLabelText('验证码'), getCaptchaCode())
    await user.click(screen.getByRole('checkbox', { name: '记住账号密码' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled()
    await waitFor(
      () => expect(navigate).toHaveBeenCalledWith('/', { replace: true }),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('登录成功')
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

  it('does not login when captcha is wrong', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('账号'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('验证码'), 'wrong')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('验证码错误')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
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
    await user.type(screen.getByLabelText('验证码'), getCaptchaCode())
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(
      () => expect(navigate).toHaveBeenCalledWith('/', { replace: true }),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('登录成功')
    expect(useAuthor.getState()).toMatchObject({
      account: '',
      encryptedPassword: '',
      remember: false,
    })
  })
})
