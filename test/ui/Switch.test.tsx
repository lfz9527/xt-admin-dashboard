import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Switch } from '@/ui/Switch'

describe('Switch', () => {
  it('受控切换：点击触发 onCheckedChange', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <Switch
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    )

    await user.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('loading：禁用交互并显示加载图标', () => {
    const onCheckedChange = vi.fn()
    render(
      <Switch
        checked={false}
        loading
        onCheckedChange={onCheckedChange}
      />
    )

    // disabled 阻止交互（root 为 span，以 aria-disabled 呈现）
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true')
    // Thumb 内渲染 Spinner（role=status）
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
