import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Login from '@/pages/login'

describe('Login page', () => {
  it('renders the complex login form and toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<Login />)

    expect(
      screen.getByRole('heading', { name: '欢迎回来' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('账号')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: '显示密码' }))
    expect(screen.getByLabelText('密码')).toHaveAttribute('type', 'text')
  })

  it('shows validation errors and blocks invalid submission', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('账号至少需要 3 个字符')).toBeInTheDocument()
    expect(screen.getByText('密码至少需要 8 个字符')).toBeInTheDocument()
    expect(screen.getByText('请输入 4 位数字验证码')).toBeInTheDocument()
    expect(screen.getByText('请先同意服务协议和隐私政策')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('refreshes captcha and submits valid values', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const captcha = screen.getByText(/^\d{4}$/)
    const previousCaptcha = captcha.textContent
    await user.click(screen.getByRole('button', { name: '刷新验证码' }))
    expect(captcha.textContent).not.toBe(previousCaptcha)

    await user.type(screen.getByLabelText('账号'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'password123')
    await user.type(screen.getByLabelText('验证码'), '1234')
    await user.click(screen.getByRole('checkbox', { name: /我已阅读并同意/ }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      '演示登录提交成功'
    )
  })
})
