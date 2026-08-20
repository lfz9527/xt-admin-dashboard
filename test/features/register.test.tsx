import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import RegisterFeature from '@/features/register'

const navigate = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock('@/ui/Toast', () => ({
  toast: { success: toastSuccess },
}))

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

describe('RegisterFeature', () => {
  beforeEach(() => {
    navigate.mockReset()
    toastSuccess.mockReset()
  })

  it('shows validation messages for empty fields', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterFeature />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(5)
  })

  it('validates email and matching passwords', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterFeature />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('邮箱'), 'invalid')
    await user.type(screen.getByLabelText('用户名'), 'admin')
    await user.type(screen.getByLabelText('验证码'), '1234')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('确认密码'), 'different')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByText('请输入有效的邮箱')).toBeInTheDocument()
    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
  })

  it('simulates registration and navigates to login', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterFeature />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('邮箱'), 'admin@example.com')
    await user.type(screen.getByLabelText('用户名'), 'admin')
    await user.type(screen.getByLabelText('验证码'), '1234')
    await user.type(screen.getByLabelText('密码'), 'password')
    await user.type(screen.getByLabelText('确认密码'), 'password')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(screen.getByRole('button', { name: /注册中/ })).toBeDisabled()
    await waitFor(
      () => expect(navigate).toHaveBeenCalledWith('/login', { replace: true }),
      { timeout: 2000 }
    )
    expect(toastSuccess).toHaveBeenCalledWith('注册成功')
  })
})
