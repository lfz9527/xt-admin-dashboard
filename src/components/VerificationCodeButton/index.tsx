import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'

import { useCountdown } from '@/hooks/useCountdown'
import { Button } from '@/ui/Button'
import { Spinner } from '@/ui/Spinner'

type VerificationCodeButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'onClick' | 'type'
> & {
  onSend: () => boolean | Promise<boolean>
  duration?: number
  idleText?: ReactNode
  countdownText?: (seconds: number) => ReactNode
  onError?: (error: unknown) => void
}

export default function VerificationCodeButton({
  onSend,
  duration = 60,
  idleText = '获取验证码',
  countdownText = (seconds) => `${seconds}s 后重新获取`,
  onError,
  disabled,
  ...props
}: VerificationCodeButtonProps) {
  const [seconds, { start }] = useCountdown({ countStart: duration })
  const [isSending, setIsSending] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)

  useEffect(() => {
    if (isCountingDown && seconds === 0) setIsCountingDown(false)
  }, [isCountingDown, seconds])

  const handleSend = async () => {
    setIsSending(true)
    try {
      const isSent = await onSend()
      if (isSent) {
        setIsCountingDown(true)
        start?.()
      }
    } catch (error) {
      onError?.(error)
    } finally {
      setIsSending(false)
    }
  }

  const isDisabled = disabled || isSending || isCountingDown

  return (
    <Button
      {...props}
      type='button'
      disabled={isDisabled}
      onClick={handleSend}
    >
      {isSending ? <Spinner /> : null}
      {isCountingDown ? countdownText(seconds) : idleText}
    </Button>
  )
}
