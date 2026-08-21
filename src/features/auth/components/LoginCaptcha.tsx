const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CAPTCHA_LENGTH = 4
const FONT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316']

export type CaptchaLayout = {
  code: string
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>
  chars: Array<{
    char: string
    x: number
    y: number
    rotate: number
    fill: string
  }>
}

export function createCaptchaLayout(length = CAPTCHA_LENGTH): CaptchaLayout {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  }

  const lines = [0, 1, 2].map((i) => ({
    x1: 4 + i * 30 + Math.random() * 12,
    y1: Math.random() * 40,
    x2: 4 + i * 30 + 22 + Math.random() * 12,
    y2: Math.random() * 40,
  }))

  const chars = code.split('').map((char, index) => ({
    char,
    x: 12 + index * 26,
    y: 27 + (Math.random() * 8 - 4),
    rotate: Math.random() * 30 - 15,
    fill: FONT_COLORS[index % FONT_COLORS.length],
  }))

  return { code, lines, chars }
}

type LoginCaptchaProps = {
  layout: CaptchaLayout
  onRefresh: () => void
}

export default function LoginCaptcha({ layout, onRefresh }: LoginCaptchaProps) {
  return (
    <button
      type='button'
      title='点击刷新验证码'
      onClick={onRefresh}
      className='border-border h-10 w-28 shrink-0 cursor-pointer rounded-md border'
    >
      <svg
        viewBox='0 0 112 40'
        className='h-full w-full'
        aria-label='图形验证码'
      >
        <rect
          width='112'
          height='40'
          fill='#f3f4f6'
        />
        {layout.lines.map((line, index) => (
          <line
            key={index}
            {...line}
            stroke='#9ca3af'
            strokeWidth='1'
          />
        ))}
        {layout.chars.map(({ char, x, y, rotate, fill }, index) => (
          <text
            key={index}
            x={x}
            y={y}
            fontSize='22'
            fontWeight='bold'
            fill={fill}
            transform={`rotate(${rotate} ${x} 20)`}
            data-slot='captcha-text'
          >
            {char}
          </text>
        ))}
      </svg>
    </button>
  )
}
