import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { EncryptionManager } from '@/utils/EncryptionManager'
import LoginFeature from '@/pages/login'
import useAuthor from '@/store/useAuthor'

const navigate = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const getCaptchaMock = vi.hoisted(() => vi.fn())
const loginMock = vi.hoisted(() => vi.fn())
const logoutMock = vi.hoisted(() => vi.fn())
const encryptionManager = new EncryptionManager('xt-admin-dashboard-login-key')

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('@/service/auth', () => ({
  getCaptcha: getCaptchaMock,
  login: loginMock,
  logout: logoutMock,
}))

const mockUser = {
  id: 1,
  nickname: 'admin',
  email: 'admin@example.com',
  avatar: '',
  gender: 0,
  status: 0,
  lastLoginTime: null,
}

describe('LoginFeature', () => {
  beforeEach(() => {
    navigate.mockReset()
    toastSuccess.mockReset()
    toastError.mockReset()
    localStorage.clear()
    getCaptchaMock.mockReset().mockResolvedValue({
      data: {
        captchaId: 'mock-captcha-id',
        image: 'data:image/svg+xml;base64,mock',
      },
    })
    loginMock.mockReset().mockResolvedValue({
      data: { access_token: 'mock-access-token', user: mockUser },
    })
    logoutMock.mockReset().mockResolvedValue({
      data: { message: '已退出登录' },
    })
    useAuthor.setState({
      token: '',
      user: null,
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
    expect(screen.getByText('欢迎你的到来，请使用邮箱登录')).toBeInTheDocument()
    expect(screen.getByLabelText(/账号\/邮箱/)).toHaveAttribute(
      'placeholder',
      '请输入邮箱/账号'
    )
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'placeholder',
      '请输入密码'
    )

    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(3)
    expect(screen.getByLabelText(/账号\/邮箱/)).toHaveAttribute(
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

  it('logs in with real auth service and stores token and user', async () => {
    const user = userEvent.setup()
    loginMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { access_token: 'mock-access-token', user: mockUser },
              }),
            500
          )
        )
    )
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() => expect(getCaptchaMock).toHaveBeenCalled())

    await user.type(screen.getByLabelText(/账号\/邮箱/), 'admin@example.com')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('验证码'), '1234')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled()
    await waitFor(
      () => expect(navigate).toHaveBeenCalledWith('/', { replace: true }),
      { timeout: 2000 }
    )
    expect(loginMock).toHaveBeenCalledWith(
      {
        email: 'admin@example.com',
        password: 'password',
        captchaId: 'mock-captcha-id',
        captchaCode: '1234',
      },
      expect.any(AbortSignal)
    )
    expect(toastSuccess).toHaveBeenCalledWith('登录成功')
    expect(useAuthor.getState().token).toBe('mock-access-token')
    expect(useAuthor.getState().user).toEqual(mockUser)
  })

  it('shows error and does not navigate when login fails', async () => {
    const user = userEvent.setup()
    loginMock.mockRejectedValue(new Error('验证码错误或已过期'))
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() => expect(getCaptchaMock).toHaveBeenCalled())

    await user.type(screen.getByLabelText(/账号\/邮箱/), 'admin@example.com')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('验证码'), 'wrong')
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('验证码错误或已过期')
    )
    expect(navigate).not.toHaveBeenCalled()
    // 登录失败不刷新验证码，仅挂载时获取 1 次
    expect(getCaptchaMock).toHaveBeenCalledTimes(1)
    expect(useAuthor.getState().token).toBe('')
  })

  it('stores encrypted credentials after submit', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() => expect(getCaptchaMock).toHaveBeenCalled())

    await user.type(screen.getByLabelText(/账号\/邮箱/), 'admin@example.com')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('验证码'), '1234')
    await user.click(screen.getByRole('checkbox', { name: '记住账号密码' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(
      () => expect(navigate).toHaveBeenCalledWith('/', { replace: true }),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('登录成功')
    expect(useAuthor.getState().token).toBe('mock-access-token')

    const stored = JSON.parse(localStorage.getItem('app-author') ?? '{}').state
    expect(stored.password).toBeUndefined()
    expect(stored.encryptedPassword).not.toContain('password')
    await expect(
      encryptionManager.decrypt(stored.encryptedPassword)
    ).resolves.toBe('password')
  })

  it('fills saved credentials on load', async () => {
    const encryptedPassword = await encryptionManager.encrypt('password')
    useAuthor.setState({
      account: 'admin@example.com',
      encryptedPassword,
      remember: true,
    })

    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/账号\/邮箱/)).toHaveValue(
        'admin@example.com'
      )
      expect(screen.getByLabelText('密码')).toHaveValue('password')
    })
    expect(screen.getByRole('checkbox', { name: '记住账号密码' })).toBeChecked()
  })

  it('clears saved credentials when remember is disabled', async () => {
    const user = userEvent.setup()
    const encryptedPassword = await encryptionManager.encrypt('password')
    useAuthor.setState({
      account: 'admin@example.com',
      encryptedPassword,
      remember: true,
    })

    render(
      <MemoryRouter>
        <LoginFeature />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByLabelText(/账号\/邮箱/)).toHaveValue(
        'admin@example.com'
      )
    )
    await user.click(screen.getByRole('checkbox', { name: '记住账号密码' }))
    await user.type(screen.getByLabelText('验证码'), '1234')
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
