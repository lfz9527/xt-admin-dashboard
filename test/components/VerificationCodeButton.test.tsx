import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import VerificationCodeButton from '@/components/VerificationCodeButton'

describe('VerificationCodeButton', () => {
  it('sends the code and starts the countdown after success', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue(true)

    render(
      <VerificationCodeButton
        duration={2}
        onSend={onSend}
      />
    )

    const button = screen.getByRole('button', { name: '获取验证码' })
    await user.click(button)

    expect(onSend).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '2s 后重新获取' })
      ).toBeDisabled()
    )
  })

  it('does not start the countdown when sending returns false', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockResolvedValue(false)

    render(<VerificationCodeButton onSend={onSend} />)

    await user.click(screen.getByRole('button', { name: '获取验证码' }))

    expect(
      screen.getByRole('button', { name: '获取验证码' })
    ).not.toBeDisabled()
  })

  it('does not start the countdown when sending fails', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn().mockRejectedValue(new Error('send failed'))
    const onError = vi.fn()

    render(
      <VerificationCodeButton
        onSend={onSend}
        onError={onError}
      />
    )

    await user.click(screen.getByRole('button', { name: '获取验证码' }))

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(
      screen.getByRole('button', { name: '获取验证码' })
    ).not.toBeDisabled()
  })
})
